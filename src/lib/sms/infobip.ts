import { plantillaSms, type SmsEnvio, type SmsProvider, type SmsResultado } from "./index";

/** Infobip · SMS 2.0. INFOBIP_BASE_URL es el subdominio, p. ej. xxxxx.api.infobip.com. */
export class InfobipSms implements SmsProvider {
  readonly nombre = "infobip";

  async enviarCodigo({ to, codigo, lang }: SmsEnvio): Promise<SmsResultado> {
    const key = process.env.INFOBIP_API_KEY;
    const base = process.env.INFOBIP_BASE_URL;
    const from = process.env.INFOBIP_FROM ?? process.env.SMS_FROM;
    if (!key || !base || !from) return { ok: false, error: "infobip_sin_configurar" };

    const r = await fetch(`https://${base.replace(/^https?:\/\//, "")}/sms/2/text/advanced`, {
      method: "POST",
      headers: { Authorization: `App ${key}`, "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ messages: [{ destinations: [{ to }], from, text: plantillaSms(lang, codigo) }] }),
      cache: "no-store",
    }).catch(() => null);
    if (!r?.ok) return { ok: false, error: `infobip_${r?.status ?? "red"}` };
    return { ok: true };
  }
}
