import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { hashPassword, startCustomerSession, assertCustomerAuthConfigured } from "@/lib/customer-auth";
import { sendVerificationPin } from "@/lib/verify";
import { requireTurnstile } from "@/lib/turnstile";

const Body = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160).transform((s) => s.toLowerCase()),
  phone: z.string().max(25).optional(),
  password: z.string().min(10).max(100).regex(/[A-Za-z]/, "La contraseña debe incluir una letra.").regex(/\d/, "La contraseña debe incluir un número."),
  marketing: z.boolean().default(false),
  acepto: z.boolean().refine((v) => v, "Debes aceptar la política de privacidad."),
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(2048).optional(),
});

export const POST = handle(async (req: Request) => {
  assertCustomerAuthConfigured(); // antes de crear nada: sin APP_SECRET no se puede iniciar sesión
  await limit(req, "register", 5);
  const b = Body.parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);
  if (b.website) return Response.json({ ok: true, pin: true }); // honeypot: no se crea nada
  if (await prisma.customer.findUnique({ where: { email: b.email } })) throw new HttpError(409, "Ya existe una cuenta con ese correo");

  const c = await prisma.customer.create({ data: { name: b.name, email: b.email, phone: b.phone, passwordHash: hashPassword(b.password) } });
  if (b.marketing) { // doble confirmación: queda PENDIENTE hasta que confirme su correo
    await prisma.subscriber.upsert({ where: { email: b.email }, create: { email: b.email, name: b.name, status: "PENDING", consentAt: new Date(), source: "registro" }, update: {} });
    await prisma.subscriber.updateMany({ where: { email: b.email, status: "UNSUBSCRIBED" }, data: { status: "PENDING", consentAt: new Date() } });
  }
  sendVerificationPin(c).catch(() => {});
  await startCustomerSession(c.id);
  return Response.json({ ok: true, pin: true });
});
