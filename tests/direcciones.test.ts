import { describe, expect, it } from "vitest";
import {
  direccionValida, normalizarDireccion, ordenarDirecciones, principalTrasBorrar, textoDireccion, validarDireccion,
} from "@/lib/direcciones";

const base = {
  label: "Casa", recipientName: "Yordan Pérez", recipientPhone: "54099988",
  provinceId: 6, provinceName: "Artemisa", municipalityId: 61, municipalityName: "Artemisa",
  address: "Calle 29 No. 5408 e/ 54 y 56", reference: "Portón verde",
};

describe("libreta de direcciones", () => {
  it("recorta espacios y pone etiqueta por defecto", () => {
    const d = normalizarDireccion({ ...base, label: "  ", address: "  Calle  5   123  " });
    expect(d.label).toBe("Casa");
    expect(d.address).toBe("Calle 5 123");
  });

  it("acepta una dirección completa con teléfono cubano", () => {
    expect(direccionValida(normalizarDireccion(base))).toBe(true);
  });

  it("rechaza nombre corto, teléfono inválido y dirección corta", () => {
    const e = validarDireccion(normalizarDireccion({ ...base, recipientName: "Yo", recipientPhone: "123", address: "Calle" }));
    expect(e.recipientName).toBe("dir.errName");
    expect(e.recipientPhone).toBe("dir.errPhone");
    expect(e.address).toBe("dir.errAddress");
  });

  it("exige provincia y municipio", () => {
    const e = validarDireccion(normalizarDireccion({ ...base, provinceId: null, municipalityId: null }));
    expect(e.provinceId).toBe("dir.errProvince");
    expect(e.municipalityId).toBe("dir.errMunicipality");
  });

  it("pone la principal primero y luego la más reciente", () => {
    const lista = [
      { id: 1, isDefault: false, updatedAt: new Date("2026-01-01") },
      { id: 2, isDefault: true, updatedAt: new Date("2025-01-01") },
      { id: 3, isDefault: false, updatedAt: new Date("2026-06-01") },
    ];
    expect(ordenarDirecciones(lista).map((d) => d.id)).toEqual([2, 3, 1]);
  });

  it("al borrar la principal asciende la más reciente", () => {
    const lista = [
      { id: 1, isDefault: true, updatedAt: new Date("2026-01-01") },
      { id: 2, isDefault: false, updatedAt: new Date("2026-06-01") },
      { id: 3, isDefault: false, updatedAt: new Date("2025-06-01") },
    ];
    expect(principalTrasBorrar(lista, 1)).toBe(2);
    expect(principalTrasBorrar(lista, 3)).toBe(1);
    expect(principalTrasBorrar([lista[0]], 1)).toBeNull();
  });

  it("compone el texto de una línea sin huecos", () => {
    expect(textoDireccion({ ...base, reference: null })).toBe("Calle 29 No. 5408 e/ 54 y 56, Artemisa, Artemisa");
  });
});
