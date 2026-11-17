import { prisma } from "./prisma";

const r2 = (n: number) => Math.round(n * 100) / 100;
export type CartInput = { productId: number; variantId?: number | null; qty: number };

// Precios y existencias SIEMPRE desde la base de datos (nunca del navegador).
// Producto con variantes activas → hay que elegir una variante; sin variantes → no admite variantId.
export async function priceCart(items: CartInput[]) {
  const entries = new Map<string, { productId: number; variantId: number | null; qty: number }>();
  for (const i of items) {
    const k = `${i.productId}:${i.variantId ?? 0}`; const e = entries.get(k);
    e ? (e.qty += i.qty) : entries.set(k, { productId: i.productId, variantId: i.variantId ?? null, qty: i.qty });
  }
  const prods = await prisma.product.findMany({ where: { id: { in: [...new Set([...entries.values()].map((e) => e.productId))] }, active: true }, include: { variants: { where: { active: true } } } });
  const lines = [...entries.values()].flatMap((e) => {
    const p = prods.find((x) => x.id === e.productId); if (!p) return [];
    const v = e.variantId ? p.variants.find((x) => x.id === e.variantId) : undefined;
    if ((p.variants.length > 0) !== !!v) return []; // falta o sobra la variante
    const unit = Number(v?.priceUsd ?? p.priceUsd); const stock = v ? v.stock : p.stock;
    return [{ productId: p.id, variantId: v?.id ?? null, slug: p.slug, name: v ? `${p.name} — ${v.name}` : p.name, image: v?.image ?? p.images[0] ?? null, unitUsd: unit, qty: e.qty, stock, ok: stock >= e.qty, totalUsd: r2(unit * e.qty) }];
  });
  return { lines, subtotalUsd: r2(lines.reduce((s, l) => s + l.totalUsd, 0)), allOk: lines.length > 0 && lines.length === entries.size && lines.every((l) => l.ok) };
}
export const usd = (n: number) => `${n.toFixed(2)} USD`;
