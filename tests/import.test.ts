import { describe, expect, it, vi } from "vitest";

type Entrada = Parameters<typeof import("@/lib/catalog").saveProduct>[0];
const saveProduct = vi.fn(async (_i: Entrada) => ({ created: false }));
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
vi.mock("@/lib/catalog", async (orig) => ({
  ...(await orig<typeof import("@/lib/catalog")>()),
  saveProduct: (i: Entrada) => saveProduct(i),
}));

import { importRows, parseSpecs } from "@/lib/import";

describe("parseSpecs", () => {
  it("lee los pares separados por barra", () =>
    expect(parseSpecs("Motor: 1200 W|Batería: 72 V")).toEqual({ Motor: "1200 W", Batería: "72 V" }));

  it("conserva los dos puntos del valor", () =>
    expect(parseSpecs("Rosca: 3/4-16 UNF|Hora: 10:30")).toEqual({ Rosca: "3/4-16 UNF", Hora: "10:30" }));

  it("descarta los pares sin clave o sin valor", () =>
    expect(parseSpecs("Tipo: Panel|: suelto|Vacío:|   ")).toEqual({ Tipo: "Panel" }));

  it("devuelve vacío si la celda está vacía", () => expect(parseSpecs("")).toEqual({}));
});

describe("importRows", () => {
  const head = ["sku", "nombre", "precio", "existencias", "categoria", "especificaciones"];
  const row = (specs: string) => [head, ["FR-1001", "Pastillas", "25", "12", "Frenos", specs]];

  it("pasa las especificaciones al guardar el producto", async () => {
    saveProduct.mockClear();
    const res = await importRows(row("Ejes: Delantero|Piezas: 4"));
    expect(res.errors).toEqual([]);
    expect(saveProduct).toHaveBeenCalledTimes(1);
    expect(saveProduct.mock.calls[0][0]).toMatchObject({ specs: { Ejes: "Delantero", Piezas: "4" } });
  });

  it("no toca las especificaciones si la celda viene vacía", async () => {
    saveProduct.mockClear();
    await importRows(row(""));
    expect(saveProduct.mock.calls[0][0]).toMatchObject({ specs: undefined });
  });
});
