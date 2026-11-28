import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { startCustomerSession } from "@/lib/customer-auth";
import { normalizarTelefono } from "@/lib/phone";
import { verificarOtp } from "@/lib/otp";
import { errorJson } from "@/lib/otp-http";

const Body = z.object({
  phone: z.string().min(4).max(30),
  code: z.string().regex(/^\d{6}$/),
});

/**
 * Valida el código y abre la sesión. Si el número tenía cuenta sin verificar,
 * se marca como verificado ahora. Nunca se dice por qué falló más allá del
 * código de error traducible (inválido, vencido, bloqueado).
 */
export const POST = handle(async (req: Request) => {
  await limit(req, "otp-verify-ip", 20, 10 * 60_000);
  const b = Body.parse(await req.json());
  const telefono = normalizarTelefono(b.phone);
  if (!telefono) return errorJson("AUTH_PHONE_INVALID", 400);
  await limitKey(telefono, "otp-verify", 10, 10 * 60_000);

  const r = await verificarOtp({ identifier: telefono, purpose: ["register", "login", "reset"], codigo: b.code });
  if (!r.ok) return errorJson(r.codigo, r.codigo === "AUTH_OTP_LOCKED" ? 429 : 400);

  const c = await prisma.customer.findUnique({ where: { phoneE164: telefono }, select: { id: true, phoneVerifiedAt: true } });
  if (!c) return errorJson("AUTH_OTP_NOT_FOUND", 400);

  if (!c.phoneVerifiedAt) await prisma.customer.update({ where: { id: c.id }, data: { phoneVerifiedAt: new Date(), phone: telefono } });
  await startCustomerSession(c.id);
  return Response.json({ ok: true, redirect: "/cuenta" });
});
