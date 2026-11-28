import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { hashPassword, requireCustomer, verifyPassword } from "@/lib/customer-auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { esContrasenaValida } from "@/lib/password-policy";
import { errorJson } from "@/lib/otp-http";

const Body = z.object({
  currentPassword: z.string().max(200).optional(),
  password: z.string().min(1).max(200),
});

/** Añade una contraseña a una cuenta que solo entra por SMS, o la cambia sabiendo la actual. */
export const POST = handle(async (req: Request) => {
  const me = await requireCustomer();
  await limit(req, "password-set", 6, 10 * 60_000);
  const b = Body.parse(await req.json());

  if (!esContrasenaValida(b.password)) return errorJson("AUTH_PASSWORD_WEAK", 400);

  const c = await prisma.customer.findUnique({ where: { id: me.id }, select: { passwordHash: true } });
  if (c?.passwordHash) {
    await limitKey(me.id, "password-check", 8, 15 * 60_000);
    if (!b.currentPassword || !verifyPassword(b.currentPassword, c.passwordHash)) return errorJson("AUTH_BAD_CURRENT", 403);
  }

  await prisma.customer.update({ where: { id: me.id }, data: { passwordHash: hashPassword(b.password) } });
  // Un enlace de restablecimiento pendiente dejaría cambiar la contraseña sin saber la nueva.
  await prisma.authToken.deleteMany({ where: { customerId: me.id, kind: "RESET", usedAt: null } });

  return Response.json({ ok: true });
});
