import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { normalizarTelefono } from "@/lib/phone";
import { crearOtp, OTP_MAX_POR_HORA, type PropositoOtp } from "@/lib/otp";
import { errorOtp, errorJson } from "@/lib/otp-http";
import { estadoSms, proveedorSms } from "@/lib/sms";
import { requireTurnstile, turnstileActivo } from "@/lib/turnstile";
import { idiomaDeCliente } from "@/lib/i18n";

const Body = z.object({
  phone: z.string().min(4).max(30),
  purpose: z.enum(["login", "reset"]).default("login"),
  turnstileToken: z.string().max(2048).optional(),
});

/**
 * Pide (o reenvía) un código por SMS para entrar o restablecer la contraseña.
 * La respuesta es idéntica exista o no la cuenta: si el número no tiene
 * cliente se crea igual el código y no se envía nada, así el enfriamiento y
 * los tiempos no delatan qué números están registrados.
 */
/**
 * El formulario de acceso consulta aquí si puede ofrecer el teléfono. En modo
 * prueba el código nunca llega al cliente, así que la pestaña se oculta.
 */
export const GET = handle(async () => {
  const { listo, proveedor } = estadoSms();
  return Response.json({ disponible: listo, proveedor });
});

export const POST = handle(async (req: Request) => {
  try {
    await limit(req, "otp-request", 8);
    // En producción un código que solo queda en el registro no le sirve a nadie.
    if (process.env.NODE_ENV === "production" && !estadoSms().listo) return errorJson("SMS_SIN_CONFIGURAR", 503);
    const b = Body.parse(await req.json());
    if (turnstileActivo()) await requireTurnstile(req, b.turnstileToken);

    const telefono = normalizarTelefono(b.phone);
    if (!telefono) return errorJson("AUTH_PHONE_INVALID", 400);

    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? null;
    await limitKey(telefono, "otp-sms-number", OTP_MAX_POR_HORA, 3600_000);
    await limit(req, "otp-sms-ip", OTP_MAX_POR_HORA * 2, 3600_000);

    const c = await prisma.customer.findUnique({ where: { phoneE164: telefono }, select: { id: true, phoneVerifiedAt: true, preferredLanguage: true } });
    const purpose: PropositoOtp = b.purpose === "reset" ? "reset" : c?.phoneVerifiedAt ? "login" : "register";

    // El canal es el teléfono: el mismo código sirve por SMS o por WhatsApp.
    const { codigo } = await crearOtp({ identifier: telefono, channel: "sms", purpose, customerId: c?.id, ip });

    let debugCode: string | undefined;
    if (c) {
      const lang = await idiomaDeCliente(c.preferredLanguage);
      const envio = await proveedorSms().enviarCodigo({ to: telefono, codigo, lang });
      if (!envio.ok) return errorJson("AUTH_SMS_SEND_FAILED", 502);
      debugCode = envio.debugCode;
    }

    return Response.json({ ok: true, retryAfter: 60, ...(debugCode ? { debugCode } : {}) });
  } catch (e) {
    const r = errorOtp(e);
    if (r) return r;
    throw e;
  }
});
