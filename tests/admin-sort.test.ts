import { describe, expect, it } from "vitest";
import { filtrarProductos, ordenarProductos, normalizar, type FilaProducto } from "@/lib/admin-sort";

const fila = (o: Partial<FilaProducto> & { id: number }): FilaProducto => ({
  sku: `SKU-${o.id}`,
  name: `Producto ${o.id}`,
  category: "General",
  priceUsd: 10,
  stock: 5,
  lowStockAt: 3,
  ...o,
});

describe("normalizar", () => {
  it("quita acentos y mayúsculas", () => expect(normalizar("  Filtro ÑANDÚ ")).toBe("filtro nandu"));
});

describe("filtrarProductos", () => {
  const filas = [fila({ id: 1, name: "Filtro de aceite" }), fila({ id: 2, name: "Pastillas de freno" }), fila({ id: 3, name: "Filtro Ñandú" })];

  it("busca por nombre sin distinguir mayúsculas", () => {
    expect(filtrarProductos(filas, "FILTRO").map((f) => f.id)).toEqual([1, 3]);
  });
  it("encuentra escribiendo sin acentos", () => {
    expect(filtrarProductos(filas, "nandu").map((f) => f.id)).toEqual([3]);
  });
  it("con la consulta vacía devuelve todo", () => {
    expect(filtrarProductos(filas, "   ")).toHaveLength(3);
  });
  it("no devuelve nada si no hay coincidencia", () => {
    expect(filtrarProductos(filas, "bujía")).toEqual([]);
  });
  it("no busca en el código: solo en el nombre", () => {
    expect(filtrarProductos([fila({ id: 9, sku: "XYZ-999", name: "Bomba" })], "XYZ")).toEqual([]);
  });
});

describe("ordenarProductos", () => {
  const filas = [fila({ id: 1, name: "C", priceUsd: 30, stock: 5 }), fila({ id: 2, name: "A", priceUsd: 10, stock: 50 }), fila({ id: 3, name: "B", priceUsd: 20, stock: 1 })];

  it("ordena texto de la A a la Z", () => {
    expect(ordenarProductos(filas, "name", "asc").map((f) => f.name)).toEqual(["A", "B", "C"]);
  });
  it("invierte con desc", () => {
    expect(ordenarProductos(filas, "name", "desc").map((f) => f.name)).toEqual(["C", "B", "A"]);
  });
  it("ordena números como números, no como texto", () => {
    // Con orden alfabético el 10 iría antes que el 5.
    expect(ordenarProductos(filas, "priceUsd", "asc").map((f) => f.priceUsd)).toEqual([10, 20, 30]);
    expect(ordenarProductos(filas, "stock", "asc").map((f) => f.stock)).toEqual([1, 5, 50]);
  });
  it("desempata por id para que la tabla no baile", () => {
    const empate = [fila({ id: 7, stock: 4 }), fila({ id: 2, stock: 4 }), fila({ id: 5, stock: 4 })];
    expect(ordenarProductos(empate, "stock", "asc").map((f) => f.id)).toEqual([2, 5, 7]);
    expect(ordenarProductos(empate, "stock", "desc").map((f) => f.id)).toEqual([2, 5, 7]);
  });
  it("no modifica el array original", () => {
    const copia = [...filas];
    ordenarProductos(filas, "name", "asc");
    expect(filas).toEqual(copia);
  });
});
