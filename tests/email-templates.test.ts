import { afterAll, beforeAll, describe, expect, it } from "vitest";
import { orderConfirmationEmail, verificationEmail, welcomeEmail } from "@/lib/email-templates";

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
});
