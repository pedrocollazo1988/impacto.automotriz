import crypto from "node:crypto";
import { prisma } from "./prisma";
import type { Idioma } from "./i18n-dict";
import { proveedorSms } from "./sms";

export type CanalOtp = "sms" | "email";
export type PropositoOtp = "register" | "login" | "reset" | "verify" | "link";

export const OTP_TTL_MS = 5 * 60_000;
export const OTP_MAX_INTENTOS = 5;
export const OTP_REENVIO_MS = 60_000;
export const OTP_MAX_POR_HORA = 5;

export type CodigoErrorOtp = "AUTH_OTP_COOLDOWN" | "AUTH_OTP_INVALID" | "AUTH_OTP_EXPIRED" | "AUTH_OTP_LOCKED" | "AUTH_OTP_NOT_FOUND";

/** Error con código estable: el frontend lo traduce, el servidor no manda texto. */
export class OtpError extends Error {
  constructor(public codigo: CodigoErrorOtp, public retryAfter = 0) {
    super(codigo);
  }
}

export const generarCodigo = () => String(crypto.randomInt(0, 1_000_000)).padStart(6, "0");

/**
 * El código nunca se guarda en claro: se guarda un HMAC con APP_SECRET. Una
 * copia de la base de datos no basta para probar los 10^6 códigos posibles.
 */
export const otpHash = (identifier: string, purpose: string, codigo: string) => {
  const secreto = process.env.APP_SECRET;
  if (!secreto) throw new Error("Falta APP_SECRET: no se pueden generar códigos.");
  return crypto.createHmac("sha256", secreto).update(`otp:${identifier}:${purpose}:${codigo}`).digest("hex");
};

const iguales = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

/** +5355551234 → +5355****34, para poder auditar sin guardar el número entero. */
export const enmascarar = (v: string) => (v.length <= 6 ? "***" : `${v.slice(0, 5)}****${v.slice(-2)}`);

export async function crearOtp(opciones: {
  identifier: string;
  channel: CanalOtp;
  purpose: PropositoOtp;
  customerId?: string | null;
  ip?: string | null;
}): Promise<{ codigo: string; id: string }> {
  const { identifier, channel, purpose, customerId, ip } = opciones;
  const ultimo = await prisma.otpCode.findFirst({
    where: { identifier, purpose, channel },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (ultimo) {
    const pasados = Date.now() - ultimo.createdAt.getTime();
    if (pasados < OTP_REENVIO_MS) throw new OtpError("AUTH_OTP_COOLDOWN", Math.ceil((OTP_REENVIO_MS - pasados) / 1000));
  }

  // Solo puede haber un código vivo por número y propósito.
  await prisma.otpCode.updateMany({ where: { identifier, purpose, consumedAt: null }, data: { consumedAt: new Date() } });

  const codigo = generarCodigo();
  const fila = await prisma.otpCode.create({
    data: { identifier, channel, purpose, codeHash: otpHash(identifier, purpose, codigo), expiresAt: new Date(Date.now() + OTP_TTL_MS), customerId: customerId ?? null, ip: ip ?? null },
    select: { id: true },
  });
  return { codigo, id: fila.id };
}

export type ResultadoOtp =
  | { ok: true; otpId: string; customerId: string | null }
  | { ok: false; codigo: Exclude<CodigoErrorOtp, "AUTH_OTP_COOLDOWN"> };

/**
 * `purpose` admite una lista: al registrarse con un número que ya tenía cuenta
 * se envía un código de "login" y el usuario lo valida desde la pantalla de
 * registro. Buscar por el propósito real del código evita decirle al cliente
 * si el número existía.
 */
export async function verificarOtp(opciones: { identifier: string; purpose: PropositoOtp | PropositoOtp[]; codigo: string }): Promise<ResultadoOtp> {
  const { identifier, codigo } = opciones;
  const purpose = Array.isArray(opciones.purpose) ? opciones.purpose : [opciones.purpose];
  const otp = await prisma.otpCode.findFirst({
    where: { identifier, purpose: { in: purpose }, consumedAt: null },
    orderBy: { createdAt: "desc" },
  });
  if (!otp) return { ok: false, codigo: "AUTH_OTP_NOT_FOUND" };

  if (otp.attempts >= OTP_MAX_INTENTOS) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return { ok: false, codigo: "AUTH_OTP_LOCKED" };
  }
  if (otp.expiresAt < new Date()) {
    await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
    return { ok: false, codigo: "AUTH_OTP_EXPIRED" };
  }

  if (!iguales(otp.codeHash, otpHash(identifier, otp.purpose, codigo))) {
    const intentos = otp.attempts + 1;
    const bloqueado = intentos >= OTP_MAX_INTENTOS;
    await prisma.otpCode.update({ where: { id: otp.id }, data: { attempts: intentos, ...(bloqueado ? { consumedAt: new Date() } : {}) } });
    await auditarFallo(identifier, otp.purpose, otp.ip);
    return { ok: false, codigo: bloqueado ? "AUTH_OTP_LOCKED" : "AUTH_OTP_INVALID" };
  }

  await prisma.otpCode.update({ where: { id: otp.id }, data: { consumedAt: new Date() } });
  return { ok: true, otpId: otp.id, customerId: otp.customerId };
}

async function auditarFallo(identifier: string, purpose: string, ip: string | null) {
  await prisma.auditLog
    .create({ data: { staffName: "sistema", action: "OTP_FALLIDO", detail: `${purpose} · ${enmascarar(identifier)} · ${ip ?? "sin ip"}` } })
    .catch(() => {});
}

/** Crea el código y lo manda por SMS. Devuelve el resultado del proveedor. */
export async function enviarOtpSms(opciones: {
  telefono: string;
  lang: Idioma;
  purpose: PropositoOtp;
  customerId?: string | null;
  ip?: string | null;
}): Promise<{ ok: boolean; debugCode?: string; error?: string }> {
  const { codigo } = await crearOtp({ identifier: opciones.telefono, channel: "sms", purpose: opciones.purpose, customerId: opciones.customerId, ip: opciones.ip });
  const envio = await proveedorSms().enviarCodigo({ to: opciones.telefono, codigo, lang: opciones.lang });
  if (!envio.ok) console.warn(`[sms] fallo al enviar a ${enmascarar(opciones.telefono)}: ${envio.error}`);
  return { ok: envio.ok, debugCode: envio.debugCode, error: envio.error };
}

export async function segundosParaReenvio(identifier: string, purpose: PropositoOtp, channel: CanalOtp = "sms"): Promise<number> {
  const ultimo = await prisma.otpCode.findFirst({ where: { identifier, purpose, channel }, orderBy: { createdAt: "desc" }, select: { createdAt: true } });
  if (!ultimo) return 0;
  const pasados = Date.now() - ultimo.createdAt.getTime();
  return pasados >= OTP_REENVIO_MS ? 0 : Math.ceil((OTP_REENVIO_MS - pasados) / 1000);
}
