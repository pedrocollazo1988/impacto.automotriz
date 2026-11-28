import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { normalizarTelefono } from "@/lib/phone";
import { enviarOtpSms, OTP_MAX_POR_HORA } from "@/lib/otp";
import { errorOtp, errorJson } from "@/lib/otp-http";
import { idiomaDeCliente } from "@/lib/i18n";

const Body = z.object({ phone: z.string().min(4).max(30) });

/** Añade o cambia el teléfono de la cuenta con sesión abierta: manda un código al número nuevo. */
export const POST = handle(async (req: Request) => {
  const me = await requireCustomer();
  try {
    await limit(req, "phone-link", 6, 10 * 60_000);
    const b = Body.parse(await req.json());

    const telefono = normalizarTelefono(b.phone);
    if (!telefono) return errorJson("AUTH_PHONE_INVALID", 400);
    if (telefono === me.phoneE164) return errorJson("AUTH_PHONE_SAME", 400);

    const otro = await prisma.customer.findUnique({ where: { phoneE164: telefono }, select: { id: true } });
    if (otro && otro.id !== me.id) return errorJson("AUTH_PHONE_TAKEN", 409);

    await limitKey(telefono, "otp-sms-number", OTP_MAX_POR_HORA, 3600_000);

    const envio = await enviarOtpSms({
      telefono,
      lang: await idiomaDeCliente(me.preferredLanguage),
      purpose: "link",
      customerId: me.id,
      ip: req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null,
    });
    if (!envio.ok) return errorJson("AUTH_SMS_SEND_FAILED", 502);

    return Response.json({ ok: true, retryAfter: 60, ...(envio.debugCode ? { debugCode: envio.debugCode } : {}) });
  } catch (e) {
    const r = errorOtp(e);
    if (r) return r;
    throw e;
  }
});
