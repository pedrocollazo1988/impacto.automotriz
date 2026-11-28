import type { Idioma } from "./i18n-dict";

/**
 * Motivos que el panel envía a la API tal como se escribieron en español: se
 * guardan así en la auditoría y el historial, y se traducen solo al pintarlos.
 */
export const MOTIVOS_CANCELACION = [
  "Producto no disponible",
  "Producto dañado",
  "Error en el pedido",
  "Precio incorrecto",
  "Otro",
] as const;

export const MOTIVOS_RETIRADA = [
  "Sin existencias",
  "Producto dañado",
  "Descontinuado",
  "Duplicado",
  "Otro",
] as const;

export const MOTIVO_EN: Record<string, string> = {
  "Producto no disponible": "Product unavailable",
  "Producto dañado": "Product damaged",
  "Error en el pedido": "Order error",
  "Precio incorrecto": "Incorrect price",
  "Sin existencias": "Out of stock",
  "Descontinuado": "Discontinued",
  "Duplicado": "Duplicate",
  "Otro": "Other",
  "Sin motivo indicado": "No reason given",
};

/**
 * Traduce un motivo aislado o uno incrustado en un detalle de auditoría
 * (`#12 · Pieza × 2 · Producto dañado`). En español devuelve el valor original.
 */
export function motivoTexto(valor: string, lang: Idioma): string {
  if (lang !== "en" || !valor) return valor;
  const directo = MOTIVO_EN[valor];
  if (directo) return directo;

  let traducido = false;
  const partes = valor.split(/(\s*·\s*)/).map((parte, i) => {
    if (i % 2 === 1) return parte;
    const limpio = parte.trim();
    const en = MOTIVO_EN[limpio];
    if (!en) return parte;
    traducido = true;
    return parte.replace(limpio, en);
  });
  return traducido ? partes.join("") : valor;
}
