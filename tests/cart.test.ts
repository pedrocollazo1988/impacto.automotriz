import { describe, expect, it } from "vitest";
import { cantidadPermitida } from "@/lib/cart";

describe("cantidadPermitida", () => {
  it("no supera el stock", () => {
    expect(cantidadPermitida(5, 3)).toBe(3);
  });
  it("conserva la cantidad si hay stock suficiente", () => {
    expect(cantidadPermitida(2, 10)).toBe(2);
  });
  it("no permite cantidades negativas", () => {
    expect(cantidadPermitida(-1, 10)).toBe(0);
  });
  it("respeta el máximo del carrito", () => {
    expect(cantidadPermitida(200, 300)).toBe(99);
  });
});
