import { cuerpoSms, type SmsEnvio, type SmsProvider, type SmsResultado } from "./index";

/**
 * INFOBIP_BASE_URL admite el subdominio (xxxxx.api.infobip.com) o una URL
 * completa; esta última permite apuntar a un servidor de pruebas.
 */
export const urlInfobip = (base: string) => (/^https?:\/\//i.test(base) ? base : `https://${base}`).replace(/\/+$/, "");

/** Infobip · SMS 2.0. INFOBIP_BASE_URL es el subdominio, p. ej. xxxxx.api.infobip.com. */
export class InfobipSms implements SmsProvider {
  readonly nombre = "infobip";

  async enviarCodigo(envio: SmsEnvio): Promise<SmsResultado> {
    const key = process.env.INFOBIP_API_KEY;
    const base = process.env.INFOBIP_BASE_URL;
    const from = process.env.INFOBIP_FROM ?? process.env.SMS_FROM;
    if (!key || !base || !from) return { ok: false, error: "infobip_sin_configurar" };

    const r = await fetch(`${urlInfobip(base)}/sms/2/text/advanced`, {
      method: "POST",
      headers: { Authorization: `App ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ messages: [{ destinations: [{ to: envio.to }], from, text: cuerpoSms(envio) }] }),
      cache: "no-store",
    }).catch(() => null);
    if (!r?.ok) return { ok: false, error: `infobip_${r?.status ?? "red"}` };
    return { ok: true };
  }
}
