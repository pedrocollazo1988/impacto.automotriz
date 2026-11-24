import crypto from "node:crypto";
import { prisma } from "./prisma";
import { sendTransactional } from "./mailer";

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");

const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

/**
 * El PIN se guarda como HMAC con APP_SECRET y el id del cliente. Una copia de
 * la base de datos no basta para probar los 10^6 códigos: hace falta el secreto
 * del servidor. Solo hay un PIN activo por cliente y vence a los 10 minutos.
 */
export const pinHash = (customerId: string, pin: string) => {
  if (!process.env.APP_SECRET) throw new Error("Falta APP_SECRET");
  return crypto.createHmac("sha256", process.env.APP_SECRET).update(`verify-pin:${customerId}:${pin}`).digest("hex");
};

export async function sendVerificationPin(c: { id: string; email: string; name: string }) {
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
  await sendTransactional(
    c.email,
    "Tu código de verificación",
    `<p>Hola ${esc(c.name)},</p>
     <p>Tu código para confirmar la cuenta es:</p>
     <p style="font-size:34px;letter-spacing:10px;font-weight:700;margin:18px 0">${pin}</p>
     <p>Vence en 10 minutos y solo se puede usar una vez. Si no creaste esta cuenta, ignora el mensaje.</p>
     <p style="font-size:12px;color:#666">Por seguridad, nunca compartas este código. Impacto Automotriz no te lo pedirá por WhatsApp ni por teléfono.</p>`,
  );
}

/** Devuelve true y marca el correo como verificado si el PIN es correcto y está vigente. */
export async function verifyCustomerPin(customerId: string, pin: string) {
  const t = await prisma.authToken.findUnique({ where: { tokenHash: pinHash(customerId, pin) }, include: { customer: true } });
  if (!t || t.customerId !== customerId || t.kind !== "VERIFY_PIN" || t.usedAt || t.expiresAt < new Date()) return false;
  await prisma.$transaction([
    prisma.customer.update({ where: { id: customerId }, data: { emailVerified: true } }),
    prisma.authToken.updateMany({ where: { customerId, kind: { in: ["VERIFY", "VERIFY_PIN"] }, usedAt: null }, data: { usedAt: new Date() } }),
    prisma.subscriber.updateMany({ where: { email: t.customer.email, status: "PENDING" }, data: { status: "ACTIVE", consentAt: new Date() } }),
  ]);
  return true;
}

// Enlace de confirmación heredado. Se conserva para no invalidar correos ya
// enviados; el registro nuevo usa el PIN.
export async function sendVerification(c: { id: string; email: string; name: string }) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.authToken.create({ data: { customerId: c.id, kind: "VERIFY", tokenHash: sha256(token), expiresAt: new Date(Date.now() + 86_400_000) } });
  await sendTransactional(c.email, "Confirma tu correo", `<p>Hola ${esc(c.name)}, confirma tu correo para activar tu cuenta y tus suscripciones:</p><p><a href="${process.env.PUBLIC_URL}/api/account/verify?token=${token}">Confirmar correo</a></p><p>El enlace vale 24 horas.</p>`);
}
