import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { confirmUrl, sendTransactional } from "@/lib/mailer";

// Suscripción pública con DOBLE CONFIRMACIÓN: queda PENDIENTE hasta que la persona pulsa el enlace del correo.
// `website` es un honeypot anti-bots (debe ir vacío).
const Body = z.object({
  email: z.string().email().max(160).transform((s) => s.toLowerCase()), name: z.string().max(80).optional(),
  provinceId: z.number().int().optional(), consent: z.literal(true), website: z.string().max(0).optional(),
  tags: z.array(z.string().max(40)).max(5).optional(), source: z.string().max(30).optional(),
});
export const POST = handle(async (req: Request) => {
  await limit(req, "subscribe", 5);
  const b = Body.parse(await req.json());
  const cur = await prisma.subscriber.findUnique({ where: { email: b.email } });
  if (cur?.status === "ACTIVE") return Response.json({ ok: true }); // no revela si ya existía
  await prisma.subscriber.upsert({
    where: { email: b.email },
    create: { email: b.email, name: b.name, provinceId: b.provinceId, tags: b.tags ?? [], status: "PENDING", consentAt: new Date(), source: b.source ?? "web" },
    update: { status: "PENDING", consentAt: new Date(), name: b.name, provinceId: b.provinceId },
  });
  sendTransactional(b.email, "Confirma tu suscripción", `<p>Para recibir nuestras novedades confirma tu suscripción:</p><p><a href="${confirmUrl(b.email)}">Sí, quiero suscribirme</a></p><p>Si no fuiste tú, ignora este correo.</p>`).catch(() => {});
  return Response.json({ ok: true, pending: true });
});
