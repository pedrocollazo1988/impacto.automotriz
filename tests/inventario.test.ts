import { beforeEach, describe, expect, it, vi } from "vitest";

const { estado, prismaFalso, notificar } = vi.hoisted(() => {
  const estado = {
    antes: { id: 7, stock: 5, sku: "A1", name: "Pieza", priceUsd: 10, active: true, categoryId: 1, brandId: null as number | null },
    despues: { id: 7, stock: 8, sku: "A1", name: "Pieza", priceUsd: 10, active: true, categoryId: 1, brandId: null as number | null },
    movimientos: [] as Record<string, unknown>[],
    lecturas: 0,
  };
  return {
    estado,
    notificar: vi.fn(async () => {}),
    prismaFalso: {
      category: { upsert: async () => ({ id: 1 }) },
      brand: { upsert: async () => ({ id: 2 }) },
      product: {
        findUnique: vi.fn(async () => (estado.lecturas++ === 0 ? estado.antes : estado.despues)),
        update: async () => estado.despues,
        create: async () => estado.despues,
      },
      productFit: { deleteMany: async () => {}, createMany: async () => {} },
      productVariant: { upsert: async () => {}, updateMany: async () => {}, aggregate: async () => ({ _sum: { stock: 0 } }) },
      productMovement: { create: vi.fn(async ({ data }: { data: Record<string, unknown> }) => { estado.movimientos.push(data); }) },
      $executeRawUnsafe: async () => 0,
    },
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaFalso }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (f: unknown) => f }));
vi.mock("@/lib/mailer", () => ({ notifyBackInStock: notificar }));

import { saveProduct } from "@/lib/catalog";

const base = { sku: "A1", name: "Pieza", priceUsd: 10, stock: 8, categoryName: "Motor" };

beforeEach(() => {
  estado.lecturas = 0;
  estado.antes.stock = 5;
  estado.despues.stock = 8;
  estado.movimientos.length = 0;
  notificar.mockClear();
});

describe("historial de inventario", () => {
  it("registra el ajuste de existencias con actor y origen", async () => {
    await saveProduct(base, 7, { actor: "Ana", source: "admin" });
    expect(estado.movimientos).toHaveLength(1);
    expect(estado.movimientos[0]).toMatchObject({
      productId: 7, kind: "AJUSTE", delta: 3, stockBefore: 5, stockAfter: 8,
      actor: "Ana", source: "admin",
    });
    expect(String(estado.movimientos[0].detail)).toContain("Existencias: 5 → 8");
  });

  it("avisa a los suscriptores cuando el producto vuelve a estar disponible", async () => {
    estado.antes.stock = 0;
    estado.despues.stock = 4;
    await saveProduct(base, 7);
    expect(notificar).toHaveBeenCalledWith("7", "Pieza", expect.stringMatching(/\/producto\/7$/));
  });
});
