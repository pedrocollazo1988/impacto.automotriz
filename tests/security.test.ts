import crypto from "node:crypto";
import { describe, expect, it, vi, beforeEach } from "vitest";
import { hashPassword, verifyPassword } from "@/lib/password";

describe("contraseñas", () => {
  it("verifica la correcta y rechaza la incorrecta o vacía", () => {
    const h = hashPassword("clave-segura-123");
    expect(verifyPassword("clave-segura-123", h)).toBe(true);
    expect(verifyPassword("otra", h)).toBe(false);
    expect(verifyPassword("x", null)).toBe(false);
  });
  it("usa sal distinta cada vez", () => expect(hashPassword("a")).not.toBe(hashPassword("a")));
});

describe("firma de notificación Tropipay", () => {
  // Las credenciales llegan por parámetro (las gestiona el panel), así que la
  // firma depende de ellas y no de process.env.
  const creds = { clientId: "id", clientSecret: "secret" };
  it("acepta la firma válida y rechaza cambios de importe", async () => {
    const { validNotification } = await import("@/lib/tropipay");
    const sig = crypto.createHash("sha256").update("BANK1" + "id" + "secret" + "2500").digest("hex");
    expect(validNotification({ bankOrderCode: "BANK1", originalCurrencyAmount: 2500, signature: sig }, creds)).toBe(true);
    expect(validNotification({ bankOrderCode: "BANK1", originalCurrencyAmount: 100, signature: sig }, creds)).toBe(false);
    expect(validNotification({ bankOrderCode: "BANK1", originalCurrencyAmount: 2500 }, creds)).toBe(false);
  });
  it("rechaza la firma hecha con otras credenciales", async () => {
    const { validNotification } = await import("@/lib/tropipay");
    const sig = crypto.createHash("sha256").update("BANK1" + "id" + "otro-secreto" + "2500").digest("hex");
    expect(validNotification({ bankOrderCode: "BANK1", originalCurrencyAmount: 2500, signature: sig }, creds)).toBe(false);
  });
});

describe("configuración de sesiones (APP_SECRET)", () => {
  it("las sesiones de cliente y de panel fallan si falta APP_SECRET", async () => {
    const { assertCustomerAuthConfigured } = await import("@/lib/customer-auth");
    const { assertStaffAuthConfigured } = await import("@/lib/auth");
    const prev = process.env.APP_SECRET;
    try {
      delete process.env.APP_SECRET;
      expect(() => assertCustomerAuthConfigured()).toThrow(/APP_SECRET/);
      expect(() => assertStaffAuthConfigured()).toThrow(/APP_SECRET/);
      process.env.APP_SECRET = "clave-larga";
      expect(() => assertCustomerAuthConfigured()).not.toThrow();
      expect(() => assertStaffAuthConfigured()).not.toThrow();
    } finally {
      if (prev === undefined) delete process.env.APP_SECRET; else process.env.APP_SECRET = prev;
    }
  });
});

describe("acceso a un pedido (IDOR)", () => {
  // El id del pedido viaja en la URL y en el correo, así que no puede ser la
  // única llave: sin token, cookie o sesión del dueño, la página da 404.
  it("solo acepta el token del propio pedido", async () => {
    process.env.APP_SECRET = "secreto-de-prueba";
    const { orderToken, tokenMatches } = await import("@/lib/order-access");
    const t = orderToken("pedido-1");
    expect(tokenMatches("pedido-1", t)).toBe(true);
    // token de otro pedido
    expect(tokenMatches("pedido-2", t)).toBe(false);
    // token manipulado o ausente
    expect(tokenMatches("pedido-1", t.slice(0, -1) + "0")).toBe(false);
    expect(tokenMatches("pedido-1", undefined)).toBe(false);
    expect(tokenMatches("pedido-1", "")).toBe(false);
  });

  it("el token cambia con APP_SECRET y no se puede recalcular sin él", async () => {
    process.env.APP_SECRET = "secreto-a";
    const { orderToken } = await import("@/lib/order-access");
    const a = orderToken("pedido-1");
    process.env.APP_SECRET = "secreto-b";
    expect(orderToken("pedido-1")).not.toBe(a);
  });
});

describe("cookie de pedidos (compra como invitado)", () => {
  // Tras comprar se deja una cookie firmada con los pedidos propios, para que
  // el invitado vea el suyo sin cuenta. La firma impide añadir ids ajenos.
  it("acepta la cookie firmada por el servidor", async () => {
    process.env.APP_SECRET = "secreto-cookie";
    const { packOrderIds, unpackOrderIds } = await import("@/lib/order-access");
    const raw = packOrderIds(["pedido-a", "pedido-b"]);
    expect(unpackOrderIds(raw)).toEqual(["pedido-a", "pedido-b"]);
  });

  it("rechaza la cookie si se le añade un pedido a mano", async () => {
    process.env.APP_SECRET = "secreto-cookie";
    const { packOrderIds, unpackOrderIds } = await import("@/lib/order-access");
    const raw = packOrderIds(["pedido-a"]);
    const [ids, sig] = [raw.slice(0, raw.lastIndexOf("|")), raw.slice(raw.lastIndexOf("|") + 1)];
    // el atacante añade su propio id conservando la firma vieja
    expect(unpackOrderIds(`pedido-a,pedido-ajeno|${sig}`)).toEqual([]);
    expect(unpackOrderIds(`pedido-ajeno|${sig}`)).toEqual([]);
    // y sin firma tampoco
    expect(unpackOrderIds("pedido-a")).toEqual([]);
    expect(unpackOrderIds(undefined)).toEqual([]);
    expect(ids).toBe("pedido-a");
  });
});
