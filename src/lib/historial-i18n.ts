import type { Idioma } from "./i18n-dict";
import { motivoTexto } from "./pedido-i18n";

/**
 * Traducción al pintar el historial de inventario, no al guardarlo: `catalog.ts`
 * sigue escribiendo las mismas frases en español en `ProductMovement.detail`,
 * así que las filas viejas y las nuevas se leen igual en inglés.
 */

/** Frases fijas (sin valores) tal como las guarda `catalog.ts`. */
export const FRASES_HISTORIAL_EN: Record<string, string> = {
  "Producto creado": "Product created",
  "Producto reactivado": "Product reactivated",
  "Producto desactivado": "Product deactivated",
  "Producto eliminado": "Product deleted",
  "Cambió la categoría": "Category changed",
  "Cambió la marca": "Brand changed",
};

/** Etiquetas con valor detrás (`Etiqueta: valor`); el valor no se toca. */
export const PREFIJOS_HISTORIAL_EN: Record<string, string> = {
  Nombre: "Name",
  Precio: "Price",
  Existencias: "Stock",
  Categoría: "Category",
  Marca: "Brand",
  SKU: "SKU",
  "Baja lógica": "Soft delete",
};

const SEPARADOR = " · ";

/** Detalles de pedidos que `checkout` y las devoluciones guardan en español. */
const PATRONES: [RegExp, string][] = [
  [/^Pedido #(\d+) cancelado:/, "Order #$1 canceled:"],
  [/^Retirado del pedido #(\d+):/, "Removed from order #$1:"],
  [/^Pedido #(\d+)$/, "Order #$1"],
  [/^variante #(\d+)$/, "variant #$1"],
];

function traducirTrozo(trozo: string): string {
  const limpio = trozo.trim();
  if (!limpio) return trozo;
  const frase = FRASES_HISTORIAL_EN[limpio];
  if (frase) return frase;
  for (const [es, en] of Object.entries(PREFIJOS_HISTORIAL_EN)) {
    if (limpio.startsWith(`${es}:`)) {
      const valor = limpio.slice(es.length + 1).trim();
      return `${en}:${es === "Baja lógica" ? ` ${motivoTexto(valor, "en")}` : limpio.slice(es.length + 1)}`;
    }
  }
  for (const [patron, en] of PATRONES) if (patron.test(limpio)) return limpio.replace(patron, en);
  return limpio;
}

/** `Nombre: A → B · Existencias: 3 → 5` → `Name: A → B · Stock: 3 → 5`. */
export function historialTexto(mensaje: string, lang: Idioma): string {
  if (lang !== "en" || !mensaje) return mensaje;
  return mensaje
    .split(/\s*·\s*/)
    .map(traducirTrozo)
    .join(SEPARADOR);
}
