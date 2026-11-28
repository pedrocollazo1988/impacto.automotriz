import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { HttpError, textoPanel } from "./auth";
import { prisma } from "./prisma";

// Tipos permitidos, validados por los primeros bytes del archivo (no por la extensión ni el tipo que declara el navegador).
const KINDS = [
  { ext: "jpg", mime: "image/jpeg", max: 5, test: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", max: 5, test: (b: Buffer) => b.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" },
  { ext: "webp", mime: "image/webp", max: 5, test: (b: Buffer) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  // glTF binario: cabecera "glTF" + versión 2 en little-endian.
  { ext: "glb", mime: "model/gltf-binary", max: 25, test: (b: Buffer) => b.subarray(0, 4).toString() === "glTF" && b.readUInt32LE(4) === 2 },
  // glTF en texto: un JSON cuyo campo asset.version empiece por 2.
  { ext: "gltf", mime: "model/gltf+json", max: 25, test: (b: Buffer) => /^\s*\{/.test(b.subarray(0, 64).toString()) && /"version"\s*:\s*"2\./.test(b.subarray(0, 2048).toString()) },
  // MP4 (ISO BMFF): la caja "ftyp" va en los bytes 4-8. Se acepta cualquier
  // marca de vídeo; el navegador decide si puede reproducirlo.
  { ext: "mp4", mime: "video/mp4", max: 40, test: (b: Buffer) => b.subarray(4, 8).toString() === "ftyp" },
  // WebM/Matroska: firma EBML en los primeros 4 bytes.
  { ext: "webm", mime: "video/webm", max: 40, test: (b: Buffer) => b.subarray(0, 4).toString("hex") === "1a45dfa3" },
] as const;

export const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", glb: "model/gltf-binary", gltf: "model/gltf+json", mp4: "video/mp4", webm: "video/webm" };
export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

// La tabla se crea en el primer uso. El build de Vercel no aplica migraciones, así
// que una migración normal nunca llegaría a Preview ni a Producción.
let tablaLista: Promise<void> | null = null;
const asegurarTabla = () => (tablaLista ??= (async () => {
  await prisma.$executeRawUnsafe(`CREATE TABLE IF NOT EXISTS "MediaFile" (
    "id" TEXT NOT NULL,
    "mime" TEXT NOT NULL,
    "size" INTEGER NOT NULL,
    "data" BYTEA NOT NULL,
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "MediaFile_pkey" PRIMARY KEY ("id")
  )`);
  await prisma.$executeRawUnsafe(`CREATE INDEX IF NOT EXISTS "MediaFile_createdAt_idx" ON "MediaFile"("createdAt")`);
})().catch((e) => { tablaLista = null; throw e; }));

type Fila = { mime: string; data: Uint8Array };

export async function readMedia(name: string): Promise<Fila | null> {
  await asegurarTabla();
  const [f] = await prisma.$queryRawUnsafe<Fila[]>(`SELECT "mime", "data" FROM "MediaFile" WHERE "id" = $1`, name);
  if (f) return f;
  try {
    return { mime: MIME[name.split(".").pop() ?? ""] ?? "application/octet-stream", data: await fs.readFile(path.join(uploadDir(), name)) };
  } catch { return null; }
}

// Con BLOB_READ_WRITE_TOKEN guarda en Vercel Blob; sin él, en la base de datos
// (Vercel no tiene disco escribible). El disco queda como respaldo local.
async function store(name: string, buf: Buffer, mime: string) {
  if (process.env.BLOB_READ_WRITE_TOKEN) return (await put(`productos/${name}`, buf, { access: "public", contentType: mime })).url;
  try {
    await asegurarTabla();
    await prisma.$executeRawUnsafe(
      `INSERT INTO "MediaFile" ("id","mime","size","data") VALUES ($1,$2,$3,$4)
       ON CONFLICT ("id") DO UPDATE SET "mime"=$2, "size"=$3, "data"=$4`,
      name, mime, buf.length, buf,
    );
    return `/media/${name}`;
  } catch {
    await fs.mkdir(uploadDir(), { recursive: true });
    await fs.writeFile(path.join(uploadDir(), name), buf);
    return `/media/${name}`;
  }
}

export async function saveUpload(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = KINDS.find((k) => k.test(buf));
  if (!kind) throw new HttpError(415, await textoPanel("Formato no admitido (usa JPG, PNG, WebP, GLB, glTF, MP4 o WebM)", "Unsupported format (use JPG, PNG, WebP, GLB, glTF, MP4 or WebM)"));
  if (buf.length > kind.max * 1024 * 1024) throw new HttpError(413, await textoPanel(`El archivo supera ${kind.max} MB`, `The file exceeds ${kind.max} MB`));
  return store(`${crypto.randomUUID()}.${kind.ext}`, buf, kind.mime);
}
