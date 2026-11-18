// Genera modelos .glb para el catálogo demo a partir de sus ilustraciones SVG.
// Ejecutar: npx tsx scripts/generate-models.ts
import fs from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";
import { buildTexturedBoxGLB } from "../src/lib/glb";

const SRC = path.join(process.cwd(), "public", "products");
const OUT = path.join(process.cwd(), "public", "models");
const TEXTURE_W = 512;

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const files = (await fs.readdir(SRC)).filter((f) => f.endsWith(".svg"));
  let n = 0;
  for (const f of files) {
    const slug = f.replace(/\.svg$/, "");
    const raw = await fs.readFile(path.join(SRC, f));
    const meta = await sharp(raw).metadata();
    const aspect = Math.max(0.3, Math.min(2.5, (meta.height ?? 600) / (meta.width ?? 800)));
    const png = await sharp(raw, { density: 384 })
      .resize(TEXTURE_W, Math.round(TEXTURE_W * aspect), { fit: "contain", background: { r: 255, g: 255, b: 255, alpha: 1 } })
      .flatten({ background: { r: 255, g: 255, b: 255 } })
      .png({ compressionLevel: 9 })
      .toBuffer();
    const glb = buildTexturedBoxGLB({ image: { data: png, mime: "image/png" }, aspect, name: slug });
    await fs.writeFile(path.join(OUT, `${slug}.glb`), glb);
    n++;
  }
  console.log(`Modelos 3D generados: ${n} en public/models/`);
}
main();
