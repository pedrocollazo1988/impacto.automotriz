import { describe, expect, it } from "vitest";
import { textoEnvio, validarCheckout } from "@/lib/checkout-validation";

const valido = { name: "Ana Pérez", email: "ana@correo.com", phone: "55512345", cartOk: true, hasDelivery: true, hasPayment: true };

describe("validarCheckout", () => {
  it("no devuelve errores con datos completos", () => {
    expect(validarCheckout(valido)).toEqual({});
  });

  it("indica cada campo que falta", () => {
    const e = validarCheckout({ name: "", email: "", phone: "", cartOk: false, hasDelivery: false, hasPayment: false });
    expect(e.cart).toContain("carrito");
    expect(e.name).toContain("nombre");
    expect(e.email).toContain("correo");
    expect(e.phone).toContain("teléfono");
    expect(e.delivery).toContain("entrega");
    expect(e.payment).toContain("pago");
  });

  it("rechaza un correo sin dominio", () => {
    expect(validarCheckout({ ...valido, email: "ana@" }).email).toContain("válido");
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
});
