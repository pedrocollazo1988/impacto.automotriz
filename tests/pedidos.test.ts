import { describe, expect, it } from "vitest";
import { contarPorEstado, estadosVisibles, filtrarPedidos, FILTRO_VACIO, type PedidoFiltrable } from "@/lib/pedidos";

const ahora = new Date("2026-11-27T12:00:00Z");
const pedidos: PedidoFiltrable[] = [
  { id: "a", number: 1001, status: "DELIVERED", createdAt: "2026-11-20T10:00:00Z" },
  { id: "b", number: 1002, status: "SHIPPED", createdAt: "2026-10-30T10:00:00Z" },
  { id: "c", number: 1003, status: "PENDING_PAYMENT", createdAt: "2026-06-01T10:00:00Z" },
];

describe("filtros de pedidos", () => {
  it("sin filtro devuelve todo", () => {
    expect(filtrarPedidos(pedidos, FILTRO_VACIO, ahora)).toHaveLength(3);
  });

  it("filtra por estado", () => {
    expect(filtrarPedidos(pedidos, { ...FILTRO_VACIO, estado: "SHIPPED" }, ahora).map((p) => p.number)).toEqual([1002]);
  });

  it("filtra por antigüedad", () => {
    expect(filtrarPedidos(pedidos, { ...FILTRO_VACIO, desdeDias: 30 }, ahora).map((p) => p.number)).toEqual([1001, 1002]);
    expect(filtrarPedidos(pedidos, { ...FILTRO_VACIO, desdeDias: 10 }, ahora).map((p) => p.number)).toEqual([1001]);
  });

  it("busca por número y admite texto con ceros o almohadilla", () => {
    expect(filtrarPedidos(pedidos, { ...FILTRO_VACIO, texto: "1003" }, ahora).map((p) => p.id)).toEqual(["c"]);
    expect(filtrarPedidos(pedidos, { ...FILTRO_VACIO, texto: "#001" }, ahora).map((p) => p.id)).toEqual(["a"]);
    expect(filtrarPedidos(pedidos, { ...FILTRO_VACIO, texto: "99" }, ahora)).toHaveLength(0);
  });

  it("combina los tres filtros", () => {
    const r = filtrarPedidos(pedidos, { estado: "DELIVERED", desdeDias: 30, texto: "1001" }, ahora);
    expect(r).toHaveLength(1);
    expect(filtrarPedidos(pedidos, { estado: "DELIVERED", desdeDias: 10, texto: "1002" }, ahora)).toHaveLength(0);
  });

  it("cuenta por estado y ofrece solo las pestañas con pedidos", () => {
    const c = contarPorEstado(pedidos);
    expect(c.TODOS).toBe(3);
    expect(c.DELIVERED).toBe(1);
    expect(c.CANCELED).toBe(0);
    expect(estadosVisibles(c, "TODOS")).toEqual(["PENDING_PAYMENT", "SHIPPED", "DELIVERED"]);
    expect(estadosVisibles(c, "CANCELED")).toContain("CANCELED");
  });
});
