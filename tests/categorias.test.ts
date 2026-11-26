import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { agruparCategorias, elegirCategoria } from "@/lib/catalog";

const cat = (id: number, slug: string, name: string, products: number, position = 0) => ({
  id, slug, name, position, _count: { products },
});

describe("elegirCategoria", () => {
  it("encuentra la categoría por nombre aunque su slug histórico sea distinto", () => {
    const cats = [cat(1, "electrico", "Sistema eléctrico", 4), cat(2, "frenos", "Frenos", 2)];
    expect(elegirCategoria(cats, "Sistema eléctrico")?.id).toBe(1);
  });

  it("prefiere la categoría que ya concentra más productos si hay duplicados", () => {
    const cats = [cat(1, "electrico", "Sistema eléctrico", 0), cat(2, "sistema-electrico", "Sistema eléctrico", 4)];
    expect(elegirCategoria(cats, "Sistema eléctrico")?.id).toBe(2);
  });

  it("no devuelve nada cuando el nombre no existe", () => {
    expect(elegirCategoria([cat(1, "frenos", "Frenos", 2)], "Motor")).toBeUndefined();
  });
});

describe("agruparCategorias", () => {
  it("fusiona duplicados por nombre y conserva el que tiene productos", () => {
    const cats = [cat(1, "electrico", "Sistema eléctrico", 0), cat(2, "sistema-electrico", "Sistema eléctrico", 4)];
    expect(agruparCategorias(cats).map((c) => c.slug)).toEqual(["sistema-electrico"]);
  });

  it("mantiene categorías distintas y las ordena por posición y nombre", () => {
    const cats = [cat(2, "motor", "Motor", 3, 2), cat(1, "frenos", "Frenos", 2, 1), cat(3, "luces", "Luces", 0, 1)];
    expect(agruparCategorias(cats).map((c) => c.slug)).toEqual(["frenos", "luces", "motor"]);
  });
});
