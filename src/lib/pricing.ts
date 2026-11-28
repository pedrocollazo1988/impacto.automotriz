import { prisma } from "./prisma";

const r2 = (n: number) => Math.round(n * 100) / 100;
export type CartInput = { productId: number; variantId?: number | null; qty: number };
type LineaBase = { productId: number; variantId: number | null; qty: number; totalUsd: number };
export type CartLineDisponible = LineaBase & {
  disponible: true;
  slug: string;
  name: string;
  image: string | null;
  unitUsd: number;
  stock: number;
  ok: boolean;
};
/** El producto o la variante ya no están en el catálogo activo: solo se puede quitar. */
export type CartLineNoDisponible = LineaBase & {
  disponible: false;
  slug: null;
  name: null;
  image: null;
  unitUsd: 0;
  stock: 0;
  ok: false;
  totalUsd: 0;
};
export type CartLine = CartLineDisponible | CartLineNoDisponible;

// Precios y existencias SIEMPRE desde la base de datos (nunca del navegador).
// Producto con variantes activas → hay que elegir una variante; sin variantes → no admite variantId.
export async function priceCart(items: CartInput[]) {
  const entries = new Map<string, { productId: number; variantId: number | null; qty: number }>();
  for (const i of items) {
    const k = `${i.productId}:${i.variantId ?? 0}`; const e = entries.get(k);
    e ? (e.qty += i.qty) : entries.set(k, { productId: i.productId, variantId: i.variantId ?? null, qty: i.qty });
  }
  const prods = await prisma.product.findMany({ where: { id: { in: [...new Set([...entries.values()].map((e) => e.productId))] }, active: true }, include: { variants: { where: { active: true } } } });
  // Cada entrada devuelve su línea aunque ya no se pueda comprar: el carrito
  // necesita verla para ofrecer el botón de quitarla. Si se omitiera, el
  // producto seguiría contando en el icono pero desaparecería de la vista.
  const lines: CartLine[] = [...entries.values()].map((e) => {
    const p = prods.find((x) => x.id === e.productId);
    const v = p && e.variantId ? p.variants.find((x) => x.id === e.variantId) : undefined;
    const sinProducto = !p || (p.variants.length > 0) !== !!v; // falta el producto o sobra/falta la variante
    if (sinProducto) return { productId: e.productId, variantId: e.variantId, slug: null, name: null, image: null, unitUsd: 0, qty: e.qty, stock: 0, disponible: false, ok: false, totalUsd: 0 };
    const unit = Number(v?.priceUsd ?? p.priceUsd); const stock = v ? Math.min(v.stock, p.stock) : p.stock;
    return { productId: p.id, variantId: v?.id ?? null, slug: p.slug, name: v ? `${p.name} — ${v.name}` : p.name, image: v?.image ?? p.images[0] ?? null, unitUsd: unit, qty: e.qty, stock, disponible: true, ok: stock >= e.qty, totalUsd: r2(unit * e.qty) };
  });
  return { lines, subtotalUsd: r2(lines.reduce((s, l) => s + l.totalUsd, 0)), allOk: lines.length > 0 && lines.every((l) => l.disponible && l.ok) };
}
export const usd = (n: number) => `${n.toFixed(2)} USD`;
