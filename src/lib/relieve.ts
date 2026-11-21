import fs from "node:fs";
import path from "node:path";

// El relieve 2.5D sustituye al giro de 36 fotogramas: misma foto real, un solo
// juego de mapas por SKU y una fracción del peso (≈100 KB frente a ≈360 KB).
//
// Los mapas los genera `npm run relieve -- <sku> <foto>`; aquí solo se leen.
// Sin mapas, la ficha sigue con la foto normal.

const cache = new Map<string, MetaRelieve | null>();

export type MetaRelieve = {
  sku: string;
  anguloMax: number;
  profundidad: number;
  generado: string;
};

export function dirRelieve(sku: string) {
  return path.join(process.cwd(), "public", "products", "relieve", sku.toLowerCase());
}

/** Devuelve los datos del relieve del SKU, o null si no se ha generado. */
export function relieveDe(sku?: string | null): MetaRelieve | null {
  if (!sku) return null;
  const clave = sku.toLowerCase();
  const dir = dirRelieve(clave);
  // La caché va por ruta, no por SKU: así no se mezclan árboles distintos.
  if (cache.has(dir)) return cache.get(dir)!;

  let meta: MetaRelieve | null = null;
  try {
    const f = path.join(dir, "meta.json");
    const completo = ["color.webp", "profundidad.webp", "recorte.webp"].every((n) => fs.existsSync(path.join(dir, n)));
    if (completo && fs.existsSync(f)) meta = JSON.parse(fs.readFileSync(f, "utf8")) as MetaRelieve;
  } catch {
    meta = null;
  }
  cache.set(dir, meta);
  return meta;
}

/** Ruta pública de los mapas, para pasársela al visor. */
export const rutaRelieve = (sku: string) => `/products/relieve/${sku.toLowerCase()}`;

/** SKU (en mayúsculas) que ya tienen sus mapas generados. */
export function skusConRelieve(): string[] {
  const dir = path.join(process.cwd(), "public", "products", "relieve");
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((e) => e.isDirectory() && relieveDe(e.name))
    .map((e) => e.name.toUpperCase());
}
