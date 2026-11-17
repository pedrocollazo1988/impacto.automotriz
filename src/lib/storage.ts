import crypto from "node:crypto";
import fs from "node:fs/promises";
import path from "node:path";
import { put } from "@vercel/blob";
import { HttpError } from "./auth";

// Tipos permitidos, validados por los primeros bytes del archivo (no por la extensión ni el tipo que declara el navegador).
const KINDS = [
  { ext: "jpg", mime: "image/jpeg", max: 5, test: (b: Buffer) => b[0] === 0xff && b[1] === 0xd8 && b[2] === 0xff },
  { ext: "png", mime: "image/png", max: 5, test: (b: Buffer) => b.subarray(0, 8).toString("hex") === "89504e470d0a1a0a" },
  { ext: "webp", mime: "image/webp", max: 5, test: (b: Buffer) => b.subarray(0, 4).toString() === "RIFF" && b.subarray(8, 12).toString() === "WEBP" },
  { ext: "glb", mime: "model/gltf-binary", max: 25, test: (b: Buffer) => b.subarray(0, 4).toString() === "glTF" },
] as const;

export const uploadDir = () => path.resolve(process.env.UPLOAD_DIR ?? "./uploads");

// Con BLOB_READ_WRITE_TOKEN guarda en Vercel Blob; si no, en disco (UPLOAD_DIR, requiere servidor con disco persistente).
export async function saveUpload(file: File) {
  const buf = Buffer.from(await file.arrayBuffer());
  const kind = KINDS.find((k) => k.test(buf));
  if (!kind) throw new HttpError(415, "Formato no admitido (usa JPG, PNG, WebP o GLB)");
  if (buf.length > kind.max * 1024 * 1024) throw new HttpError(413, `El archivo supera ${kind.max} MB`);
  const name = `${crypto.randomUUID()}.${kind.ext}`;
  if (process.env.BLOB_READ_WRITE_TOKEN) return (await put(`productos/${name}`, buf, { access: "public", contentType: kind.mime })).url;
  await fs.mkdir(uploadDir(), { recursive: true });
  await fs.writeFile(path.join(uploadDir(), name), buf);
  return `/media/${name}`;
}
export const MIME: Record<string, string> = { jpg: "image/jpeg", png: "image/png", webp: "image/webp", glb: "model/gltf-binary" };
