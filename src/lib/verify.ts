import crypto from "node:crypto";
import { prisma } from "./prisma";
import { sendTransactional, type SendResult } from "./mailer";
import { verificationEmail, verificationLinkEmail, welcomeEmail } from "./email-templates";
import { emailT } from "./email-i18n";
import type { Idioma } from "./i18n-dict";

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");


/**
 * El PIN se guarda como HMAC con APP_SECRET y el id del cliente. Una copia de
 * la base de datos no basta para probar los 10^6 códigos: hace falta el secreto
 * del servidor. Solo hay un PIN activo por cliente y vence a los 10 minutos.
 */
export const pinHash = (customerId: string, pin: string) => {
  if (!process.env.APP_SECRET) throw new Error("Falta APP_SECRET");
  return crypto.createHmac("sha256", process.env.APP_SECRET).update(`verify-pin:${customerId}:${pin}`).digest("hex");
};

export async function sendVerificationPin(c: { id: string; email: string | null; name: string }, lang: Idioma = "es"): Promise<SendResult> {
  if (!c.email) return { ok: false, error: "sin_correo" };
  const pin = String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");
  await prisma.authToken.deleteMany({ where: { customerId: c.id, kind: "VERIFY_PIN", usedAt: null } });
  await prisma.authToken.create({
    data: {
      customerId: c.id,
      kind: "VERIFY_PIN",
      tokenHash: pinHash(c.id, pin),
      expiresAt: new Date(Date.now() + 10 * 60_000),
    },
  });
  return sendTransactional(
    c.email,
    emailT(lang, "verification.subject"),
    verificationEmail({ name: c.name, pin, lang }),
  );
}

export function sendWelcomeEmail(c: { email: string | null; name: string }, lang: Idioma = "es"): Promise<SendResult> {
  if (!c.email) return Promise.resolve({ ok: false, error: "sin_correo" });
  return sendTransactional(
    c.email,
    emailT(lang, "welcome.subject"),
    welcomeEmail({ name: c.name, email: c.email, lang }),
  );
}

/** Devuelve true y marca el correo como verificado si el PIN es correcto y está vigente. */
export async function verifyCustomerPin(customerId: string, pin: string) {
  const t = await prisma.authToken.findUnique({ where: { tokenHash: pinHash(customerId, pin) }, include: { customer: true } });
  if (!t || t.customerId !== customerId || t.kind !== "VERIFY_PIN" || t.usedAt || t.expiresAt < new Date()) return false;
  await prisma.$transaction([
    prisma.customer.update({ where: { id: customerId }, data: { emailVerified: true, emailVerifiedAt: new Date() } }),
    prisma.authToken.updateMany({ where: { customerId, kind: { in: ["VERIFY", "VERIFY_PIN"] }, usedAt: null }, data: { usedAt: new Date() } }),
    ...(t.customer.email
      ? [prisma.subscriber.updateMany({ where: { email: t.customer.email, status: "PENDING" }, data: { status: "ACTIVE", consentAt: new Date() } })]
      : []),
  ]);
  return true;
}

// Enlace de confirmación heredado. Se conserva para no invalidar correos ya
// enviados; el registro nuevo usa el PIN.
export async function sendVerification(c: { id: string; email: string; name: string }, lang: Idioma = "es") {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.authToken.create({ data: { customerId: c.id, kind: "VERIFY", tokenHash: sha256(token), expiresAt: new Date(Date.now() + 86_400_000) } });
  return sendTransactional(c.email, emailT(lang, "verification.subject"), verificationLinkEmail({ name: c.name, url: `${process.env.PUBLIC_URL}/api/account/verify?token=${token}`, lang }));
}
