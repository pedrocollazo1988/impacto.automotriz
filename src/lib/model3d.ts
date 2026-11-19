import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { HttpError } from "./auth";
import { buildTexturedBoxGLB, type GlbImage } from "./glb";
import { saveModel, uploadDir } from "./storage";

const MAX_BYTES = 12 * 1024 * 1024;
const TEXTURE_W = 768;

// Obtiene los bytes de una imagen del catálogo: archivo en /public, subida en /media o URL remota.
async function readImage(src: string): Promise<Buffer> {
  if (/^https?:\/\//i.test(src)) {
    const r = await fetch(src, { signal: AbortSignal.timeout(15000) });
    if (!r.ok) throw new HttpError(400, "No se pudo descargar la imagen del producto");
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length > MAX_BYTES) throw new HttpError(413, "La imagen es demasiado grande");
    return buf;
  }
  if (src.startsWith("/media/")) {
    const name = path.basename(src);
    if (!/^[0-9a-f-]{36}\.(jpg|png|webp)$/.test(name)) throw new HttpError(400, "Imagen no válida");
    return fs.readFile(path.join(uploadDir(), name));
  }
  if (src.startsWith("/")) {
    const rel = path.normalize(src).replace(/^(\.\.[/\\])+/, "").replace(/^[/\\]+/, "");
    const abs = path.join(process.cwd(), "public", rel);
    if (!abs.startsWith(path.join(process.cwd(), "public"))) throw new HttpError(400, "Ruta no válida");
    return fs.readFile(abs);
  }
  throw new HttpError(400, "Origen de imagen no admitido");
}

// Convierte una foto en un modelo .glb (losa 3D texturizada) y lo guarda.
export async function generateModel3dFromImage(imageSrc: string, name?: string) {
  const raw = await readImage(imageSrc);
  let png: Buffer;
  let aspect: number;
  try {
    const meta = await sharp(raw).metadata();
    const w0 = meta.width ?? 1;
    const h0 = meta.height ?? 1;
    // El alto de la losa sigue la proporción de la foto (acotada), y la textura se
    // genera con esa misma proporción para que no haya deformación.
    aspect = Math.max(0.3, Math.min(2.5, h0 / w0));
    const tw = TEXTURE_W;
    const th = Math.round(TEXTURE_W * aspect);
    png = await sharp(raw, { density: 384 })
      .resize(tw, th, { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
  } catch {
    throw new HttpError(415, "No se pudo procesar la imagen del producto");
  }
  if (png.length > MAX_BYTES) throw new HttpError(413, "La textura resultante es demasiado grande");
  const image: GlbImage = { data: png, mime: "image/png" };
  const glb = buildTexturedBoxGLB({ image, aspect, name });
  return saveModel(glb);
}
