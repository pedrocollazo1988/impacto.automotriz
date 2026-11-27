import { describe, expect, it } from "vitest";
import { esE164, normalizarTelefono, paisDelNavegador, telefonoLegible } from "@/lib/phone";
import { plantillaSms } from "@/lib/sms";

describe("normalizarTelefono", () => {
  it("acepta un número cubano con el país por defecto", () => {
    expect(normalizarTelefono("5555 1234")).toBe("+5355551234");
  });

  it("respeta el prefijo internacional escrito por el usuario", () => {
    expect(normalizarTelefono("+34 612 345 678")).toBe("+34612345678");
    expect(normalizarTelefono("+1 (305) 555-0199")).toBe("+13055550199");
  });

  it("rechaza números imposibles y textos", () => {
    expect(normalizarTelefono("")).toBeNull();
    expect(normalizarTelefono("123")).toBeNull();
    expect(normalizarTelefono("hola")).toBeNull();
    expect(normalizarTelefono("+34 000 000 000")).toBeNull();
  });

  it("usa el país indicado cuando el número va sin prefijo", () => {
    expect(normalizarTelefono("612 34 56 78", "ES")).toBe("+34612345678");
  });
});

describe("esE164", () => {
  it("solo acepta el formato con prefijo y sin símbolos", () => {
    expect(esE164("+5355551234")).toBe(true);
    expect(esE164("5355551234")).toBe(false);
    expect(esE164("+53 5555 1234")).toBe(false);
  });
});

describe("paisDelNavegador", () => {
  it("saca la región de la etiqueta del navegador", () => {
    expect(paisDelNavegador("es-ES")).toBe("ES");
    expect(paisDelNavegador("en-US")).toBe("US");
  });

  it("cae al país de la tienda si no hay región válida", () => {
    expect(paisDelNavegador("es")).toBe("CU");
    expect(paisDelNavegador("xx-ZZ")).toBe("CU");
  });
});

describe("telefonoLegible", () => {
  it("formatea en internacional", () => {
    expect(telefonoLegible("+5355551234")).toContain("+53");
  });

  it("tolera vacío", () => {
    expect(telefonoLegible(null)).toBe("");
  });
});

describe("plantillaSms", () => {
  it("incluye el código, el idioma y ningún enlace", () => {
    const es = plantillaSms("es", "123456");
    const en = plantillaSms("en", "123456");
    expect(es).toContain("123456");
    expect(en).toContain("123456");
    expect(es).toContain("Impacto Automotriz");
    expect(en.toLowerCase()).toContain("expires");
    expect(es).not.toMatch(/https?:\/\//);
    expect(en).not.toMatch(/https?:\/\//);
  });
});
