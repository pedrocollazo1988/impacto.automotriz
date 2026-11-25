import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { adminOrderEmail, campaignEmail, orderConfirmationEmail, orderStatusEmail, passwordResetEmail, subscriptionConfirmEmail, verificationEmail, welcomeEmail } from "@/lib/email-templates";
import { emailT } from "@/lib/email-i18n";

describe("plantillas de correo", () => {
  let prev: string | undefined;

  beforeAll(() => {
    prev = process.env.PUBLIC_URL;
    process.env.PUBLIC_URL = "https://tienda.example";
  });

  afterAll(() => {
    if (prev === undefined) delete process.env.PUBLIC_URL;
    else process.env.PUBLIC_URL = prev;
  });

  it("la bienvenida escapa el nombre y el correo", () => {
    const html = welcomeEmail({ name: '<script>alert("x")</script>', email: "ana&luis@example.com" });
    expect(html).not.toContain("<script>");
    expect(html).toContain("&lt;script&gt;");
    expect(html).toContain("ana&amp;luis@example.com");
    expect(html).toContain("https://tienda.example/brand/logo.png");
  });

  it("la verificación muestra el PIN y su vigencia", () => {
    const html = verificationEmail({ name: "Ana", pin: "123456" });
    expect(html).toContain("123456");
    expect(html).toContain("Vence en 10 minutos");
  });

  it("la confirmación de pedido incluye líneas, total, PIN y un enlace seguro", () => {
    const html = orderConfirmationEmail({
      name: "Ana",
      orderNumber: 42,
      total: "12.50 USD",
      items: [{ name: "Filtro <b>", qty: 2, price: "10.00 USD" }],
      trackingUrl: "javascript:alert(1)",
      deliveryPin: "987654",
    });
    expect(html).toContain("Filtro &lt;b&gt;");
    expect(html).toContain("12.50 USD");
    expect(html).toContain("987654");
    expect(html).not.toContain('href="javascript:');
    expect(html).toContain('href="https://tienda.example/"');
  });

  it("rechaza enlaces protocol-relative en los botones", () => {
    const html = orderConfirmationEmail({ name: "Ana", orderNumber: 1, trackingUrl: "//evil.example/phishing" });
    expect(html).not.toContain('href="//evil.example');
    expect(html).toContain('href="https://tienda.example/"');
  });

  it("cambia todo el texto al inglés cuando se pide", () => {
    const html = welcomeEmail({ name: "Ana", email: "ana@example.com", lang: "en" });
    expect(html).toContain('<html lang="en">');
    expect(html).toContain("Welcome to Impacto Automotriz");
    expect(html).toContain("Verify your email");
    expect(html).not.toContain("Bienvenido a Impacto Automotriz");
  });

  it("el cambio de estado usa la etiqueta traducida y lleva el PIN", () => {
    const es = orderStatusEmail({ name: "Ana", orderNumber: 7, status: "SHIPPED", deliveryPin: "123456", lang: "es" });
    expect(es).toContain("Enviado");
    expect(es).toContain("123456");
    const en = orderStatusEmail({ name: "Ana", orderNumber: 7, status: "SHIPPED", lang: "en" });
    expect(en).toContain("Shipped");
    expect(en).toContain('<html lang="en">');
  });

  it("recuperación, suscripción y aviso al administrador usan la plantilla de marca", () => {
    for (const html of [
      passwordResetEmail({ name: "Ana", url: "https://tienda.example/reset", lang: "en" }),
      subscriptionConfirmEmail({ name: "Ana", url: "https://tienda.example/confirm", lang: "en" }),
      adminOrderEmail({ orderNumber: 9, customerName: "Ana", customerEmail: "ana@example.com", total: "10.00 USD", proformaUrl: "https://tienda.example/admin/pedidos/x/prefactura", lang: "es" }),
    ]) {
      expect(html).toContain("https://tienda.example/brand/logo.png");
      expect(html).toContain("#0b2a5b");
    }
  });

  it("las campañas se envuelven en la marca y escapan la URL de baja", () => {
    const html = campaignEmail({ subject: "Ofertas", html: "<p>Hola</p>", lang: "en", unsubscribeUrl: 'https://x/?a="b' });
    expect(html).toContain("https://tienda.example/brand/logo.png");
    expect(html).toContain("Unsubscribe");
    expect(html).toContain("&quot;b");
  });

  it("una campaña con HTML completo también sale con la marca", () => {
    const html = campaignEmail({ subject: "Ofertas", html: "<!doctype html><html><head><title>x</title></head><body><p>Hola</p></body></html>", lang: "es" });
    expect(html).toContain("https://tienda.example/brand/logo.png");
    expect(html).toContain("<p>Hola</p>");
    expect(html.match(/<html/g)?.length).toBe(1);
  });

  it("no deja claves sin traducir en inglés", () => {
    for (const key of ["verification.subject", "welcome.subject", "order.subject", "status.subject", "reset.subject", "subscribe.subject"]) {
      expect(emailT("en", key, { number: 1, total: "1 USD", status: "Shipped" })).not.toContain("{");
    }
  });
});
