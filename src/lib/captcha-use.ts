import crypto from "node:crypto";
import { prisma } from "./prisma";

const TTL_MS = 11 * 60_000;

/**
 * Marca un reto como usado. La clave es el hash del token, no el token: si la
 * tabla se filtra no se puede reutilizar un captcha ya resuelto.
 */
export async function consumeCaptchaToken(token: string): Promise<boolean> {
  const key = `captcha-use:${crypto.createHash("sha256").update(token).digest("hex")}`;
  try {
    await prisma.rateLimit.create({ data: { key, count: 1, resetAt: new Date(Date.now() + TTL_MS) } });
    return true;
  } catch (e) {
    if ((e as { code?: string }).code === "P2002") return false;
    throw e;
  }
}
