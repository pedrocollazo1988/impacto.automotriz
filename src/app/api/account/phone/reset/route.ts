import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { hashPassword, startCustomerSession } from "@/lib/customer-auth";
import { normalizarTelefono } from "@/lib/phone";
import { verificarOtp } from "@/lib/otp";
import { errorJson } from "@/lib/otp-http";

const Body = z.object({
  phone: z.string().min(4).max(30),
  code: z.string().regex(/^\d{6}$/),
  password: z.string().min(10).max(100).regex(/[A-Za-z]/, "La contraseña debe incluir una letra.").regex(/\d/, "La contraseña debe incluir un número."),
});

/** Restablece la contraseña con el código recibido por SMS y deja la sesión abierta. */
export const POST = handle(async (req: Request) => {
  await limit(req, "otp-reset-ip", 10, 10 * 60_000);
  const b = Body.parse(await req.json());
  const telefono = normalizarTelefono(b.phone);
  if (!telefono) return errorJson("AUTH_PHONE_INVALID", 400);
  await limitKey(telefono, "otp-reset", 5, 15 * 60_000);

  const r = await verificarOtp({ identifier: telefono, purpose: ["reset", "login", "register"], codigo: b.code });
  if (!r.ok) return errorJson(r.codigo, r.codigo === "AUTH_OTP_LOCKED" ? 429 : 400);

  const c = await prisma.customer.findUnique({ where: { phoneE164: telefono }, select: { id: true, phoneVerifiedAt: true } });
  if (!c) return errorJson("AUTH_OTP_NOT_FOUND", 400);

  await prisma.customer.update({
    where: { id: c.id },
    data: { passwordHash: hashPassword(b.password), ...(c.phoneVerifiedAt ? {} : { phoneVerifiedAt: new Date() }) },
  });
  await startCustomerSession(c.id);
  return Response.json({ ok: true });
});
