import { describe, expect, it } from "vitest";
import { calcularTarifaEntrega } from "@/lib/shipping-fee";

describe("calcularTarifaEntrega", () => {
  it("usa la tarifa base cuando no hay regla", () => {
    expect(calcularTarifaEntrega({ baseFee: "15", subtotalUsd: 100 })).toBe(15);
  });

  it("la regla de zona manda sobre la base", () => {
    expect(calcularTarifaEntrega({ baseFee: 15, ruleFee: "8", subtotalUsd: 100 })).toBe(8);
  });

  it("una regla con tarifa 0 es envío gratis explícito", () => {
    expect(calcularTarifaEntrega({ baseFee: 15, ruleFee: 0, subtotalUsd: 100 })).toBe(0);
  });

  it("«gratis desde 0» no libera el envío", () => {
    expect(calcularTarifaEntrega({ baseFee: 15, freeFromUsd: 0, subtotalUsd: 100 })).toBe(15);
  });

  it("libera el envío al alcanzar el umbral", () => {
    expect(calcularTarifaEntrega({ baseFee: 15, freeFromUsd: 100, subtotalUsd: 100 })).toBe(0);
    expect(calcularTarifaEntrega({ baseFee: 15, freeFromUsd: 100, subtotalUsd: 99.99 })).toBe(15);
  });

  it("admite decimales con coma desde el panel", () => {
    expect(calcularTarifaEntrega({ baseFee: "12,50", subtotalUsd: 100 })).toBe(12.5);
  });

  it("no devuelve negativos ni NaN", () => {
    expect(calcularTarifaEntrega({ baseFee: -5, subtotalUsd: 100 })).toBe(0);
    expect(calcularTarifaEntrega({ baseFee: "no", ruleFee: undefined, subtotalUsd: 100 })).toBe(0);
  });
});
