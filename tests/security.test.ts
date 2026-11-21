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
