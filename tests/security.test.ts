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
  beforeEach(() => { process.env.TROPIPAY_CLIENT_ID = "id"; process.env.TROPIPAY_CLIENT_SECRET = "secret"; });
  it("acepta la firma válida y rechaza cambios de importe", async () => {
    const { validNotification } = await import("@/lib/tropipay");
    const sig = crypto.createHash("sha256").update("BANK1" + "id" + "secret" + "2500").digest("hex");
    expect(validNotification({ bankOrderCode: "BANK1", originalCurrencyAmount: 2500, signature: sig })).toBe(true);
    expect(validNotification({ bankOrderCode: "BANK1", originalCurrencyAmount: 100, signature: sig })).toBe(false);
    expect(validNotification({ bankOrderCode: "BANK1", originalCurrencyAmount: 2500 })).toBe(false);
  });
});
