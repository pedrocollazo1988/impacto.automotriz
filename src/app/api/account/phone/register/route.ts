import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorHttp } from "@/lib/mensajes";
import { handle, HttpError } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { assertCustomerAuthConfigured, hashPassword } from "@/lib/customer-auth";
import { normalizarTelefono } from "@/lib/phone";
import { enviarOtpSms, OTP_MAX_POR_HORA } from "@/lib/otp";
import { errorOtp, errorJson } from "@/lib/otp-http";
import { requireTurnstile, turnstileActivo } from "@/lib/turnstile";
import { verifyCaptcha } from "@/lib/captcha";
import { consumeCaptchaToken } from "@/lib/captcha-use";
import { idiomaDeCliente } from "@/lib/i18n";

const Body = z.object({
  name: z.string().min(2).max(120),
  phone: z.string().min(4).max(30),
  password: z.string().min(10).max(100).regex(/[A-Za-z]/, "La contraseña debe incluir una letra.").regex(/\d/, "La contraseña debe incluir un número.").optional(),
  marketing: z.boolean().default(false),
  acepto: z.boolean().refine((v) => v, "Debes aceptar la política de privacidad."),
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(2048).optional(),
  captchaToken: z.string().max(4096).optional(),
  captchaAnswer: z.string().max(64).optional(),
});

/**
 * Registro por teléfono. Crea la cuenta sin verificar y manda el código.
 * Si el número ya tiene cuenta verificada, manda un código de acceso en vez
 * de revelar que existe: la respuesta es la misma en todos los casos.
 */
export const POST = handle(async (req: Request) => {
  try {
    assertCustomerAuthConfigured();
    await limit(req, "phone-register", 5);
    const b = Body.parse(await req.json());

    if (turnstileActivo()) await requireTurnstile(req, b.turnstileToken);
    else if (!verifyCaptcha(b.captchaToken ?? "", b.captchaAnswer ?? ""))
      throw await errorHttp(400, "codigo.invalido");

    if (b.website) return Response.json({ ok: true }); // honeypot
    if (!turnstileActivo() && !(await consumeCaptchaToken(b.captchaToken ?? "")))
      throw await errorHttp(400, "codigo.usado");

    const telefono = normalizarTelefono(b.phone);
    if (!telefono) return errorJson("AUTH_PHONE_INVALID", 400);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await limitKey(telefono, "otp-sms-number", OTP_MAX_POR_HORA, 3600_000);
    await limit(req, "otp-sms-ip", OTP_MAX_POR_HORA * 2, 3600_000);

    const existente = await prisma.customer.findUnique({ where: { phoneE164: telefono }, select: { id: true, phoneVerifiedAt: true, preferredLanguage: true } });
    const lang = await idiomaDeCliente(existente?.preferredLanguage);

    let customerId: string;
    let purpose: "register" | "login";
    if (existente?.phoneVerifiedAt) {
      customerId = existente.id;
      purpose = "login";
    } else if (existente) {
      // Cuenta a medias: se actualiza con lo que acaba de escribir y se reenvía.
      await prisma.customer.update({ where: { id: existente.id }, data: { name: b.name, phone: telefono, preferredLanguage: existente.preferredLanguage ?? lang, ...(b.password ? { passwordHash: hashPassword(b.password) } : {}) } });
      customerId = existente.id;
      purpose = "register";
    } else {
      const c = await prisma.customer.create({
        data: { name: b.name, phoneE164: telefono, phone: telefono, ...(b.password ? { passwordHash: hashPassword(b.password) } : {}), preferredLanguage: lang },
        select: { id: true },
      });
      customerId = c.id;
      purpose = "register";
    }

    const envio = await enviarOtpSms({ telefono, lang, purpose, customerId, ip });
    if (!envio.ok) return errorJson("AUTH_SMS_SEND_FAILED", 502);

    return Response.json({ ok: true, retryAfter: 60, ...(envio.debugCode ? { debugCode: envio.debugCode } : {}) });
  } catch (e) {
    const r = errorOtp(e);
    if (r) return r;
    throw e;
  }
});
