import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { endCustomerSession, getCustomer, startCustomerSession, verifyPassword } from "@/lib/customer-auth";
import { requireTurnstile } from "@/lib/turnstile";
import { normalizarTelefono } from "@/lib/phone";

export const GET = handle(async () => Response.json(await getCustomer()));   // null si no hay sesión

// Se puede entrar con correo o con teléfono, siempre con contraseña.
const Body = z.union([
  z.object({ email: z.string().email().transform((s) => s.toLowerCase()), password: z.string().max(100), turnstileToken: z.string().max(2048).optional() }),
  z.object({ phone: z.string().min(4).max(30), password: z.string().max(100), turnstileToken: z.string().max(2048).optional() }),
]);

export const POST = handle(async (req: Request) => {                         // iniciar sesión
  await limit(req, "login", 8);
  const b = Body.parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);

  const esCorreo = "email" in b;
  const telefono = esCorreo ? null : normalizarTelefono(b.phone);
  if (!esCorreo && !telefono) throw new HttpError(400, "AUTH_PHONE_INVALID");
  const clave = esCorreo ? b.email : telefono!;
  await limitKey(clave, "login-clave", 10, 10 * 60_000);

  const c = esCorreo
    ? await prisma.customer.findUnique({ where: { email: clave } })
    : await prisma.customer.findUnique({ where: { phoneE164: clave } });
  if (!c || !c.passwordHash || !verifyPassword(b.password, c.passwordHash)) throw new HttpError(401, "AUTH_BAD_CREDENTIALS");
  await startCustomerSession(c.id);
  return Response.json({ ok: true });
});
export const DELETE = handle(async () => { await endCustomerSession(); return Response.json({ ok: true }); });
