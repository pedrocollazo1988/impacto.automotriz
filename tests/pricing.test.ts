import { beforeEach, describe, expect, it, vi } from "vitest";

const db = vi.hoisted(() => ({ product: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
import { priceCart } from "@/lib/pricing";

const producto = (stock: number, varianteStock: number) => ({
  id: 1, slug: "producto", name: "Producto", priceUsd: 10, stock, images: [],
  variants: [{ id: 5, name: "Opción", priceUsd: null, stock: varianteStock, image: null, active: true }],
});

describe("priceCart", () => {
  beforeEach(() => db.product.findMany.mockReset());

  it("usa el menor stock entre producto y variante", async () => {
    db.product.findMany.mockResolvedValue([producto(2, 10)]);
    const r = await priceCart([{ productId: 1, variantId: 5, qty: 3 }]);
    expect(r.lines[0]).toMatchObject({ stock: 2, ok: false });
    expect(r.allOk).toBe(false);
  });

  it("acepta la cantidad cuando cabe en el stock efectivo", async () => {
    db.product.findMany.mockResolvedValue([producto(10, 2)]);
    const r = await priceCart([{ productId: 1, variantId: 5, qty: 2 }]);
    expect(r.lines[0]).toMatchObject({ stock: 2, ok: true });
    expect(r.allOk).toBe(true);
  });
});
