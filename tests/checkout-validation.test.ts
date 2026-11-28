import { describe, expect, it } from "vitest";
import { textoEnvio, validarCheckout } from "@/lib/checkout-validation";
import { DICCIONARIO } from "@/lib/i18n-dict";

const valido = { name: "Ana Pérez", email: "ana@correo.com", phone: "55512345", cartOk: true, hasDelivery: true, hasPayment: true };

describe("validarCheckout", () => {
  it("no devuelve errores con datos completos", () => {
    expect(validarCheckout(valido)).toEqual({});
  });

  it("indica cada campo que falta con su clave traducible", () => {
    const e = validarCheckout({ name: "", email: "", phone: "", cartOk: false, hasDelivery: false, hasPayment: false });
    expect(e.cart).toBe("checkout2.errCart");
    expect(e.name).toBe("checkout2.errName");
    expect(e.email).toBe("checkout2.errEmail");
    expect(e.phone).toBe("checkout2.errPhone");
    expect(e.delivery).toBe("checkout2.errDelivery");
    expect(e.payment).toBe("checkout2.errPayment");
  });

  it("todas las claves de error existen en los dos idiomas", () => {
    const e = validarCheckout({ name: "", email: "", phone: "", cartOk: false, hasDelivery: false, hasPayment: false });
    for (const clave of Object.values(e)) {
      expect(DICCIONARIO.es[clave], clave).toBeTruthy();
      expect(DICCIONARIO.en[clave], clave).toBeTruthy();
    }
  });

  it("rechaza un correo sin dominio", () => {
    expect(validarCheckout({ ...valido, email: "ana@" }).email).toBe("checkout2.errEmail");
  });
});

describe("textoEnvio", () => {
  it("muestra Por calcular antes de elegir método", () => {
    expect(textoEnvio(false, 0)).toBe("Por calcular");
    expect(textoEnvio(false, 12)).toBe("Por calcular");
  });

  it("muestra Gratis si la tarifa es 0", () => {
    expect(textoEnvio(true, 0)).toBe("Gratis");
  });

  it("muestra el importe con dos decimales", () => {
    expect(textoEnvio(true, 12.5)).toBe("12.50 USD");
  });

  it("traduce al inglés", () => {
    expect(textoEnvio(false, 0, "en")).toBe("To calculate");
    expect(textoEnvio(true, 0, "en")).toBe("Free");
    expect(textoEnvio(true, 12.5, "en")).toBe("12.50 USD");
  });
});
