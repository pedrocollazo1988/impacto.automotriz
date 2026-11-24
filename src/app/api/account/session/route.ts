import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { endCustomerSession, getCustomer, startCustomerSession, verifyPassword } from "@/lib/customer-auth";
import { requireTurnstile } from "@/lib/turnstile";

export const GET = handle(async () => Response.json(await getCustomer()));   // null si no hay sesión
export const POST = handle(async (req: Request) => {                         // iniciar sesión
  await limit(req, "login", 8);
  const b = z.object({
    email: z.string().email().transform((s) => s.toLowerCase()),
    password: z.string().max(100),
    turnstileToken: z.string().max(2048).optional(),
  }).parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);
  await limitKey(b.email, "login-email", 10, 10 * 60_000);
  const c = await prisma.customer.findUnique({ where: { email: b.email } });
  if (!c || !verifyPassword(b.password, c.passwordHash)) throw new HttpError(401, "Correo o contraseña incorrectos");
  await startCustomerSession(c.id);
  return Response.json({ ok: true });
});
export const DELETE = handle(async () => { await endCustomerSession(); return Response.json({ ok: true }); });
