import fs from "node:fs";
import path from "node:path";

// Secuencia de fotos del giro: public/products/360/<sku>-01.webp, -02, ...
// Con menos de 8 fotos no hay giro creíble y se usa la foto suelta.
const MINIMO = 8;
const MAXIMO = 72;

const cache = new Map<string, string[]>();

export function fotos360(sku?: string | null): string[] {
  if (!sku) return [];
  const skuMin = sku.toLowerCase();
  const dir = path.join(process.cwd(), "public", "products", "360");
  const clave = `${dir}:${skuMin}`;
  const guardado = cache.get(clave);
  if (guardado) return guardado;

  const out: string[] = [];
  for (let n = 1; n <= MAXIMO; n++) {
    const nombre = `${skuMin}-${String(n).padStart(2, "0")}.webp`;
    if (!fs.existsSync(path.join(dir, nombre))) break;
    out.push(`/products/360/${nombre}`);
  }
  const valido = out.length >= MINIMO ? out : [];
  cache.set(clave, valido);
  return valido;
}

// SKU (en mayúsculas) que tienen secuencia suficiente para girar.
export function skusConGiro(): string[] {
  const dir = path.join(process.cwd(), "public", "products", "360");
  if (!fs.existsSync(dir)) return [];
  const cuenta = new Map<string, number>();
  for (const f of fs.readdirSync(dir)) {
    const m = /^(.+)-(\d{2})\.webp$/.exec(f);
    if (m) cuenta.set(m[1], (cuenta.get(m[1]) ?? 0) + 1);
  }
  return [...cuenta.entries()].filter(([, n]) => n >= MINIMO).map(([sku]) => sku.toUpperCase());
}
