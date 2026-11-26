import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { confirmUrl, sendTransactional } from "@/lib/mailer";
import { requireTurnstile } from "@/lib/turnstile";
import { getLang } from "@/lib/i18n";
import { subscriptionConfirmEmail } from "@/lib/email-templates";
import { emailT } from "@/lib/email-i18n";

// Suscripción pública con DOBLE CONFIRMACIÓN: queda PENDIENTE hasta que la persona pulsa el enlace del correo.
// `website` es un honeypot anti-bots (debe ir vacío).
const Body = z.object({
  email: z.string().email().max(160).transform((s) => s.toLowerCase()), name: z.string().max(80).optional(),
  // El formulario público envía solo el correo: el envío del formulario es el consentimiento.
  provinceId: z.number().int().optional(), consent: z.literal(true).default(true), website: z.string().max(0).optional(),
  tags: z.array(z.string().max(40)).max(5).optional(), source: z.string().max(30).optional(),
  turnstileToken: z.string().max(2048).optional(),
});
export const POST = handle(async (req: Request) => {
  await limit(req, "subscribe", 5);
  const b = Body.parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);
  const lang = await getLang();
  const cur = await prisma.subscriber.findUnique({ where: { email: b.email } });
  if (cur?.status === "ACTIVE") return Response.json({ ok: true }); // no revela si ya existía
  await prisma.subscriber.upsert({
    where: { email: b.email },
    create: { email: b.email, name: b.name, provinceId: b.provinceId, tags: b.tags ?? [], status: "PENDING", consentAt: new Date(), source: b.source ?? "web", lang },
    update: { status: "PENDING", consentAt: new Date(), name: b.name, provinceId: b.provinceId, lang },
  });
  sendTransactional(b.email, emailT(lang, "subscribe.subject"), subscriptionConfirmEmail({ name: b.name, url: confirmUrl(b.email), lang })).catch(() => {});
  return Response.json({ ok: true, pending: true });
});
