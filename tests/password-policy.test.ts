import { describe, expect, it } from "vitest";
import { MIN_CLAVE, esContrasenaValida } from "@/lib/password-policy";

describe("política de contraseñas", () => {
  it("exige el mínimo de caracteres", () => {
    expect(MIN_CLAVE).toBe(10);
    expect(esContrasenaValida("abc123456")).toBe(false);
    expect(esContrasenaValida("abc1234567")).toBe(true);
  });

  it("exige letra y número", () => {
    expect(esContrasenaValida("1234567890")).toBe(false);
    expect(esContrasenaValida("abcdefghij")).toBe(false);
    expect(esContrasenaValida("impacto2026")).toBe(true);
  });

  it("cuenta los espacios como caracteres, no los recorta", () => {
    expect(esContrasenaValida("           ")).toBe(false);
    expect(esContrasenaValida("  clave 1  ")).toBe(true);
  });

  it("rechaza la cadena vacía", () => {
    expect(esContrasenaValida("")).toBe(false);
  });
});
