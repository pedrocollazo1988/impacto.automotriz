import type { Idioma } from "../i18n-dict";
import { MockSms } from "./mock";
import { TwilioSms } from "./twilio";
import { VonageSms } from "./vonage";
import { InfobipSms } from "./infobip";

export type SmsEnvio = { to: string; codigo: string; lang: Idioma };
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

/**
 * Elige el proveedor por SMS_PROVIDER. Si no se indica, usa el primero cuyas
 * credenciales estén completas y, si no hay ninguna, el mock (desarrollo).
 */
export function proveedorSms(): SmsProvider {
  const elegido = (process.env.SMS_PROVIDER ?? "").trim().toLowerCase();
  const tiene = (...claves: string[]) => claves.every((k) => !!process.env[k]);

  if (elegido === "twilio" || (!elegido && tiene("TWILIO_ACCOUNT_SID", "TWILIO_AUTH_TOKEN"))) return new TwilioSms();
  if (elegido === "vonage" || (!elegido && tiene("VONAGE_API_KEY", "VONAGE_API_SECRET"))) return new VonageSms();
  if (elegido === "infobip" || (!elegido && tiene("INFOBIP_API_KEY", "INFOBIP_BASE_URL"))) return new InfobipSms();
  return new MockSms();
}
