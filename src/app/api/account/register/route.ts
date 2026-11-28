import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { errorHttp } from "@/lib/mensajes";
import { handle, HttpError } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { hashPassword, startCustomerSession, assertCustomerAuthConfigured } from "@/lib/customer-auth";
import { mailStatus } from "@/lib/mailer";
import { sendVerificationPin, sendWelcomeEmail } from "@/lib/verify";
import { requireTurnstile, turnstileActivo } from "@/lib/turnstile";
import { verifyCaptcha } from "@/lib/captcha";
import { consumeCaptchaToken } from "@/lib/captcha-use";
import { getLang } from "@/lib/i18n";

const Body = z.object({
  name: z.string().min(2).max(120),
  email: z.string().email().max(160).transform((s) => s.toLowerCase()),
  phone: z.string().max(25).optional(),
  password: z.string().min(10).max(100).regex(/[A-Za-z]/, "La contraseña debe incluir una letra.").regex(/\d/, "La contraseña debe incluir un número."),
  marketing: z.boolean().default(false),
  acepto: z.boolean().refine((v) => v, "Debes aceptar la política de privacidad."),
  website: z.string().max(200).optional(),
  turnstileToken: z.string().max(2048).optional(),
  captchaToken: z.string().max(4096).optional(),
  captchaAnswer: z.string().max(64).optional(),
});

export const POST = handle(async (req: Request) => {
  assertCustomerAuthConfigured(); // antes de crear nada: sin APP_SECRET no se puede iniciar sesión
  // Sin servidor de correo la cuenta quedaría creada pero sin confirmar, y el
  // cliente no podría ni entrar ni volver a registrarse.
  if (!(await mailStatus()).configured) throw new HttpError(503, "MAIL_SIN_CONFIGURAR");
  await limit(req, "register", 5);
  const b = Body.parse(await req.json());
  if (turnstileActivo()) {
    await requireTurnstile(req, b.turnstileToken);
  } else if (!verifyCaptcha(b.captchaToken ?? "", b.captchaAnswer ?? "")) {
    throw await errorHttp(400, "codigo.invalido");
  }
  if (b.website) return Response.json({ ok: true, pin: true }); // honeypot: no se crea nada
  if (await prisma.customer.findUnique({ where: { email: b.email } })) throw await errorHttp(409, "cuenta.yaExiste");
  if (!turnstileActivo() && !(await consumeCaptchaToken(b.captchaToken ?? ""))) {
    throw await errorHttp(400, "codigo.usado");
  }

  const lang = await getLang();
  const c = await prisma.customer.create({ data: { name: b.name, email: b.email, phone: b.phone, passwordHash: hashPassword(b.password) } });
  if (b.marketing) { // doble confirmación: queda PENDIENTE hasta que confirme su correo
    await prisma.subscriber.upsert({ where: { email: b.email }, create: { email: b.email, name: b.name, status: "PENDING", consentAt: new Date(), source: "registro", lang }, update: { lang } });
    await prisma.subscriber.updateMany({ where: { email: b.email, status: "UNSUBSCRIBED" }, data: { status: "PENDING", consentAt: new Date() } });
  }
  const [email] = await Promise.all([
    sendVerificationPin({ id: c.id, email: b.email, name: c.name }, lang),
    sendWelcomeEmail({ email: b.email, name: c.name }, lang).catch(() => null),
  ]);
  await startCustomerSession(c.id);
  return Response.json({ ok: true, pin: true, emailSent: email.ok, ...(email.ok ? {} : { emailError: "No se pudo enviar el código. Revisa la configuración de correo o pide un reenvío." }) });
});
