import { describe, expect, it } from "vitest";
import { CLAVES_MENSAJE, idiomaDeCookie, textoMensaje } from "@/lib/mensajes";

describe("mensajes del servidor", () => {
  it("traduce al español y al inglés", () => {
    expect(textoMensaje("cupon.agotado", "es")).toBe("Cupón agotado");
    expect(textoMensaje("cupon.agotado", "en")).toBe("Coupon used up");
  });

  it("por defecto habla español", () => {
    expect(textoMensaje("pago.noDisponible")).toBe("Este pedido no admite pago en línea");
  });

  it("reconoce el idioma de la cookie y cualquier otra cosa cae en español", () => {
    expect(idiomaDeCookie("en")).toBe("en");
    expect(idiomaDeCookie("es")).toBe("es");
    expect(idiomaDeCookie(undefined)).toBe("es");
    expect(idiomaDeCookie("fr")).toBe("es");
  });

  it("todos los mensajes están en los dos idiomas, son distintos y no se repiten", () => {
    expect(CLAVES_MENSAJE.length).toBeGreaterThan(10);
    const vistos = new Set<string>();
    for (const clave of CLAVES_MENSAJE) {
      const es = textoMensaje(clave, "es");
      const en = textoMensaje(clave, "en");
      expect(es.length).toBeGreaterThan(3);
      expect(en.length).toBeGreaterThan(3);
      expect(es).not.toBe(en);
      expect(vistos.has(es)).toBe(false);
      vistos.add(es);
    }
  });
});
