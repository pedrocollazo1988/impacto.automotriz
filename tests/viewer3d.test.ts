import { beforeEach, describe, expect, it, vi } from "vitest";

const { capturado, prismaFalso } = vi.hoisted(() => {
  const capturado: { data?: Record<string, unknown> } = {};
  const guardar = async ({ data }: { data: Record<string, unknown> }) => {
    capturado.data = data;
    return { id: 7, sku: "X" };
  };
  return {
    capturado,
    prismaFalso: {
      category: { upsert: async () => ({ id: 1 }) },
      brand: { upsert: async () => ({ id: 2 }) },
      product: { findUnique: async () => ({ id: 7 }), update: guardar, create: guardar },
      productFit: { deleteMany: async () => {}, createMany: async () => {} },
      productVariant: { upsert: async () => {}, updateMany: async () => {} },
      productMovement: { create: async () => {} },
      $executeRawUnsafe: async () => 0,
    },
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaFalso }));
vi.mock("next/cache", () => ({ revalidateTag: vi.fn(), unstable_cache: (f: unknown) => f }));

import { saveProduct } from "@/lib/catalog";
import { esVista, VISTAS } from "@/lib/viewer";

const base = { sku: "A1", name: "Pieza", priceUsd: 10, stock: 1, categoryName: "Motor" };

beforeEach(() => { capturado.data = undefined; vi.clearAllMocks(); });

describe("vistas del visor", () => {
  it("reconoce solo las vistas declaradas", () => {
    for (const v of VISTAS) expect(esVista(v)).toBe(true);
    expect(esVista("video")).toBe(false);
    expect(esVista(undefined)).toBe(false);
    expect(esVista(7)).toBe(false);
  });
});

describe("saveProduct y el modelo 3D", () => {
  it("guarda el modelo y la vista cuando se envían", async () => {
    await saveProduct({ ...base, model3dUrl: "/media/a.glb", viewerMode: "model3d" }, 7);
    expect(capturado.data?.model3dUrl).toBe("/media/a.glb");
    expect(capturado.data?.viewerMode).toBe("model3d");
  });

  it("permite borrar el modelo enviando null explícito", async () => {
    await saveProduct({ ...base, model3dUrl: null }, 7);
    expect(capturado.data).toHaveProperty("model3dUrl", null);
  });

  it("no toca el modelo ni la vista si no vienen (reimportación del catálogo)", async () => {
    await saveProduct({ ...base }, 7);
    expect(capturado.data).not.toHaveProperty("model3dUrl");
    expect(capturado.data).not.toHaveProperty("viewerMode");
  });

  it("descarta una vista desconocida en vez de guardarla", async () => {
    await saveProduct({ ...base, viewerMode: "holograma" }, 7);
    expect(capturado.data).not.toHaveProperty("viewerMode");
  });
});
