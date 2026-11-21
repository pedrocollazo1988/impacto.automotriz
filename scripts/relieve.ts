/**
 * Genera el relieve 2.5D de un producto a partir de su foto real.
 *
 * No hay modelo 3D ni fotos desde otros ángulos: se estima la profundidad de la
 * foto con IA (Depth Anything V2) y se recorta el objeto (RMBG-1.4). Con esos
 * dos mapas el visor desplaza cada píxel según su distancia a la cámara y da
 * sensación de volumen al arrastrar.
 *
 * Uso:
 *   npm run relieve -- <sku> <ruta-foto> [--angulo 26]
 *
 * Requiere los modelos ONNX (una sola vez):
 *   hf download onnx-community/depth-anything-v2-small onnx/model_int8.onnx --local-dir /tmp/models/depth
 *   hf download briaai/RMBG-1.4 onnx/model.onnx --local-dir /tmp/models/rmbg
 *
 * Salida en public/products/relieve/<sku>/: color.webp, profundidad.webp,
 * recorte.webp y meta.json con el ángulo máximo que no deja huecos visibles.
 */
import fs from "node:fs";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { dirRelieve, type MetaRelieve } from "../src/lib/relieve";

const ANCHO_COLOR = 600;
const ANCHO_MAPA = 300;

const modelos = () => process.env.RELIEVE_MODELOS ?? "/tmp/models";
const python = () => process.env.RELIEVE_PYTHON ?? "python3";

/** Primer .onnx del árbol, saltando las variantes que no usamos. */
function buscarOnnx(base: string): string | null {
  if (!fs.existsSync(base)) return null;
  if (base.endsWith(".onnx")) return base;
  const pila = [base];
  while (pila.length) {
    const d = pila.pop()!;
    for (const e of fs.readdirSync(d, { withFileTypes: true })) {
      const p = path.join(d, e.name);
      if (e.isDirectory()) pila.push(p);
      else if (e.name.endsWith(".onnx") && !/fp16|bnb|q4|int4/.test(e.name)) return p;
    }
  }
  return null;
}

function main() {
  const args = process.argv.slice(2);
  if (args.length < 2) {
    console.error("Uso: npm run relieve -- <sku> <ruta-foto> [--angulo 26]");
    process.exit(1);
  }
  const [sku, foto] = args;
  const iAng = args.indexOf("--angulo");
  const angulo = iAng >= 0 ? Number(args[iAng + 1]) : 26;

  if (!fs.existsSync(foto)) throw new Error(`No existe la foto: ${foto}`);

  const prof = buscarOnnx(path.join(modelos(), "depth"));
  const seg = buscarOnnx(path.join(modelos(), "rmbg"));
  if (!prof || !seg) {
    throw new Error(
      `Faltan los modelos ONNX en ${modelos()}/depth y ${modelos()}/rmbg.\n` +
        "  hf download onnx-community/depth-anything-v2-small onnx/model_int8.onnx --local-dir /tmp/models/depth\n" +
        "  hf download briaai/RMBG-1.4 onnx/model.onnx --local-dir /tmp/models/rmbg",
    );
  }

  const salida = dirRelieve(sku);
  fs.mkdirSync(salida, { recursive: true });

  const py = path.join(process.cwd(), "scripts", "relieve.py");
  const stdout = execFileSync(python(), [
    py, "--foto", foto, "--salida", salida, "--prof", prof, "--seg", seg,
    "--angulo", String(angulo), "--ancho-color", String(ANCHO_COLOR), "--ancho-mapa", String(ANCHO_MAPA),
  ], { encoding: "utf8" });

  // El script mide hasta qué ángulo la foto no deja huecos; se guarda ese.
  const medido = JSON.parse(stdout.trim().split("\n").pop() ?? "{}") as { anguloSeguro?: number };
  const meta: MetaRelieve = {
    sku: sku.toUpperCase(),
    anguloMax: medido.anguloSeguro ?? angulo,
    profundidad: 0.85,
    generado: new Date().toISOString().slice(0, 10),
  };
  fs.writeFileSync(path.join(salida, "meta.json"), JSON.stringify(meta, null, 2));

  const kb = (f: string) => Math.round(fs.statSync(path.join(salida, f)).size / 1024);
  const total = kb("color.webp") + kb("profundidad.webp") + kb("recorte.webp");
  console.log(`Relieve ${meta.sku} listo en ${salida}`);
  console.log(`  color ${kb("color.webp")} KB · profundidad ${kb("profundidad.webp")} KB · recorte ${kb("recorte.webp")} KB`);
  console.log(`  total ${total} KB · ángulo ±${meta.anguloMax}°`);
}

main();
