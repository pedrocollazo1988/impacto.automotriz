import type { Idioma } from "../i18n-dict";
import { MockSms } from "./mock";
import { TwilioSms } from "./twilio";
import { VonageSms } from "./vonage";
import { InfobipSms } from "./infobip";
import { WhatsappSms } from "./whatsapp";

export type SmsEnvio = { to: string; codigo: string; lang: Idioma; texto?: string };
export type SmsResultado = { ok: boolean; error?: string; debugCode?: string };

/**
 * Puerto del proveedor de SMS. La lógica de OTP no conoce Twilio ni Vonage:
 * solo pide "envía este código a este número" y recibe un resultado.
 */
export interface SmsProvider {
  readonly nombre: string;
  enviarCodigo(envio: SmsEnvio): Promise<SmsResultado>;
}

/** Sin enlaces y en el idioma del usuario, como pide la política de mensajes. */
export const plantillaSms = (lang: Idioma, codigo: string) =>
  lang === "en"
    ? `Impacto Automotriz: your verification code is ${codigo}. It expires in 5 minutes. Do not share it.`
    : `Impacto Automotriz: tu código de verificación es ${codigo}. Caduca en 5 minutos. No lo compartas.`;

/** Texto de la prueba de configuración que se envía desde el panel. */
export const mensajePrueba = (lang: Idioma) =>
  lang === "en"
    ? "Impacto Automotriz: SMS configuration test. If you receive this message, sending works."
    : "Impacto Automotriz: prueba de configuración de SMS. Si recibes este mensaje, el envío funciona.";
export const MENSAJE_PRUEBA = mensajePrueba("es");

export const cuerpoSms = (envio: SmsEnvio) => envio.texto ?? plantillaSms(envio.lang, envio.codigo);

export type NombreProveedor = "twilio" | "vonage" | "infobip" | "whatsapp" | "mock";
type ProveedorReal = Exclude<NombreProveedor, "mock">;

// Cada grupo es "una de estas variables": se cumple si hay al menos una.
const VARIABLES: Record<ProveedorReal, string[][]> = {
  twilio: [["TWILIO_ACCOUNT_SID"], ["TWILIO_AUTH_TOKEN"], ["TWILIO_FROM", "TWILIO_MESSAGING_SERVICE_SID"]],
  vonage: [["VONAGE_API_KEY"], ["VONAGE_API_SECRET"]],
  infobip: [["INFOBIP_API_KEY"], ["INFOBIP_BASE_URL"], ["INFOBIP_FROM", "SMS_FROM"]],
  // WhatsApp no necesita remitente: el número va en el identificador del negocio.
  whatsapp: [["WHATSAPP_TOKEN"], ["WHATSAPP_PHONE_ID"]],
};

// En autodetección el SMS gana; WhatsApp se usa cuando es el único completo
// o cuando SMS_PROVIDER="whatsapp" lo fuerza (recomendado para Cuba).
const ORDEN: ProveedorReal[] = ["twilio", "vonage", "infobip", "whatsapp"];

export const faltantesSms = (proveedor: ProveedorReal, env: Record<string, string | undefined> = process.env) =>
  VARIABLES[proveedor].filter((grupo) => !grupo.some((clave) => !!env[clave])).map((grupo) => grupo.join(" o "));

/**
 * Elige el proveedor por SMS_PROVIDER. Si no se indica, usa el primero cuyas
 * credenciales estén completas y, si no hay ninguna, el mock (desarrollo).
 * Devuelve también qué variables faltan, para poder diagnosticarlo en el panel.
 */
export function elegirProveedor(env: Record<string, string | undefined> = process.env): { proveedor: NombreProveedor; faltan: string[] } {
  const elegido = (env.SMS_PROVIDER ?? "").trim().toLowerCase();
  const forzado = ORDEN.find((p) => p === elegido);
  if (forzado) return { proveedor: forzado, faltan: faltantesSms(forzado, env) };
  if (!elegido) {
    const completo = ORDEN.find((p) => faltantesSms(p, env).length === 0);
    if (completo) return { proveedor: completo, faltan: [] };
  }
  return { proveedor: "mock", faltan: [] };
}

/** Estado para el panel: si el envío real está listo y qué falta cuando no lo está. */
export function estadoSms(env: Record<string, string | undefined> = process.env) {
  const { proveedor, faltan } = elegirProveedor(env);
  const real = proveedor !== "mock";
  return { proveedor, real, listo: real && faltan.length === 0, faltan };
}

export function proveedorSms(env: Record<string, string | undefined> = process.env): SmsProvider {
  switch (elegirProveedor(env).proveedor) {
    case "twilio": return new TwilioSms();
    case "vonage": return new VonageSms();
    case "infobip": return new InfobipSms();
    case "whatsapp": return new WhatsappSms();
    default: return new MockSms();
  }
}
