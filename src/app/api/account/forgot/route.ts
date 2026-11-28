import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { mailStatus, sendTransactional } from "@/lib/mailer";
import { requireTurnstile } from "@/lib/turnstile";
import { idiomaDeCliente } from "@/lib/i18n";
import { passwordResetEmail } from "@/lib/email-templates";
import { emailT } from "@/lib/email-i18n";

// Siempre responde igual, exista o no la cuenta (no revela qué correos están registrados).
export const POST = handle(async (req: Request) => {
  await limit(req, "forgot", 3);
  const b = z.object({
    email: z.string().email().transform((s) => s.toLowerCase()),
    turnstileToken: z.string().max(2048).optional(),
  }).parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);
  await limitKey(b.email, "forgot-email", 3, 15 * 60_000);
  // Sin servidor de correo el enlace no llegaría nunca. Se comprueba antes de
  // mirar la cuenta para no revelar qué correos están registrados.
  if (!(await mailStatus()).configured) return Response.json({ error: "MAIL_SIN_CONFIGURAR" }, { status: 503 });
  const c = await prisma.customer.findUnique({ where: { email: b.email } });
  if (c) {
    const lang = await idiomaDeCliente(c.preferredLanguage);
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.authToken.deleteMany({ where: { customerId: c.id, kind: "RESET", usedAt: null } });
    await prisma.authToken.create({ data: { customerId: c.id, kind: "RESET", tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) } });
    await sendTransactional(b.email, emailT(lang, "reset.subject"), passwordResetEmail({ name: c.name, url: `${process.env.PUBLIC_URL}/cuenta/restablecer?token=${token}`, lang }));
  }
  return Response.json({ ok: true });
});
