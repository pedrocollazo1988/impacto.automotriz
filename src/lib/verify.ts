import crypto from "node:crypto";
import { prisma } from "./prisma";
import { sendTransactional } from "./mailer";

export const sha256 = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export async function sendVerification(c: { id: string; email: string; name: string }) {
  const token = crypto.randomBytes(32).toString("hex");
  await prisma.authToken.create({ data: { customerId: c.id, kind: "VERIFY", tokenHash: sha256(token), expiresAt: new Date(Date.now() + 86_400_000) } });
  await sendTransactional(c.email, "Confirma tu correo", `<p>Hola ${c.name.replace(/[<>&"]/g, "")}, confirma tu correo para activar tu cuenta y tus suscripciones:</p><p><a href="${process.env.PUBLIC_URL}/api/account/verify?token=${token}">Confirmar correo</a></p><p>El enlace vale 24 horas.</p>`);
}
