// Lectura bilingüe de lo que escribe el negocio: categorías, productos,
// marcas, métodos de entrega y de pago.
//
// Orden de preferencia para el inglés: columna inglesa en la base de datos →
// traducción de fábrica del catálogo de ejemplo → texto español. Así nunca
// queda un hueco en blanco y el negocio manda en cuanto rellena su versión.

import {
  categoriaDeFabrica,
  entregaDeFabrica,
  etiquetaPiezaDeFabrica,
  marcaDeFabrica,
  pagoDeFabrica,
  productoDeFabrica,
} from "./catalogo-en";
import { pagoTexto } from "./pagos-i18n";

const en = (lang: string) => lang === "en";
const limpio = (v: string | null | undefined) => (v ?? "").trim();

type Producto = {
  slug: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  specs?: unknown;
  specsEn?: unknown;
};

export function nombreProducto(p: Producto, lang: string): string {
  if (!en(lang)) return p.name;
  return limpio(p.nameEn) || productoDeFabrica(p)?.name || p.name;
}

export function descripcionProducto(p: Producto, lang: string): string {
  if (!en(lang)) return p.description ?? "";
  return limpio(p.descriptionEn) || productoDeFabrica(p)?.description || p.description || "";
}

/** Especificaciones como pares ordenados, ya en el idioma pedido. */
export function specsProducto(p: Producto, lang: string): [string, string][] {
  const base = p.specs;
  let fuente: unknown = base;
  if (en(lang)) {
    const propias = p.specsEn;
    const deFabrica = productoDeFabrica(p)?.specs;
    fuente = conDatos(propias) ? propias : conDatos(deFabrica) ? deFabrica : base;
  }
  if (!fuente || typeof fuente !== "object" || Array.isArray(fuente)) return [];
  return Object.entries(fuente as Record<string, unknown>)
    .filter(([, v]) => v !== null && v !== undefined && String(v).trim() !== "")
    .map(([k, v]) => [k, Array.isArray(v) ? v.join(", ") : String(v)]);
}

function conDatos(v: unknown): boolean {
  return !!v && typeof v === "object" && !Array.isArray(v) && Object.keys(v as object).length > 0;
}

/** Etiqueta corta del pin en el dibujo del despiece. */
export function etiquetaPieza(
  p: { sku?: string | null; name: string; label?: string | null },
  lang: string,
): string {
  if (!en(lang)) return p.label ?? p.name;
  return etiquetaPiezaDeFabrica(p) || p.label || p.name;
}

type Categoria = {
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
};

export function nombreCategoria(c: Categoria, lang: string): string {
  if (!en(lang)) return c.name;
  return limpio(c.nameEn) || categoriaDeFabrica(c.name) || c.name;
}

export function descripcionCategoria(c: Categoria, lang: string): string {
  if (!en(lang)) return c.description ?? "";
  return limpio(c.descriptionEn) || c.description || "";
}

type Marca = { name: string; nameEn?: string | null };

export function nombreMarca(b: Marca, lang: string): string {
  if (!en(lang)) return b.name;
  return limpio(b.nameEn) || marcaDeFabrica(b.name) || b.name;
}

type Entrega = { code: string; name: string; nameEn?: string | null; description?: string | null; descriptionEn?: string | null };

export function nombreEntrega(m: Entrega, lang: string): string {
  if (!en(lang)) return m.name;
  return limpio(m.nameEn) || entregaDeFabrica(m.code)?.name || m.name;
}

export function descripcionEntrega(m: Entrega, lang: string): string {
  if (!en(lang)) return m.description ?? "";
  return limpio(m.descriptionEn) || entregaDeFabrica(m.code)?.description || m.description || "";
}

type Pago = {
  key: string;
  name: string;
  nameEn?: string | null;
  description?: string | null;
  descriptionEn?: string | null;
  instructions?: string | null;
  instructionsEn?: string | null;
};

export function nombrePago(g: Pago, lang: string): string {
  if (!en(lang)) return g.name;
  return limpio(g.nameEn) || pagoDeFabrica(g.key)?.name || pagoTexto(g.name, lang);
}

export function descripcionPago(g: Pago, lang: string): string {
  if (!en(lang)) return g.description ?? "";
  return limpio(g.descriptionEn) || pagoDeFabrica(g.key)?.description || pagoTexto(g.description ?? "", lang);
}

export function instruccionesPago(g: Pago, lang: string): string {
  if (!en(lang)) return g.instructions ?? "";
  return limpio(g.instructionsEn) || pagoDeFabrica(g.key)?.instructions || pagoTexto(g.instructions ?? "", lang);
}
