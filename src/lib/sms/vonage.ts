import { cuerpoSms, type SmsEnvio, type SmsProvider, type SmsResultado } from "./index";

/** Vonage (antes Nexmo) · SMS API clásica. El destino va sin el "+". */
export class VonageSms implements SmsProvider {
  readonly nombre = "vonage";

  async enviarCodigo(envio: SmsEnvio): Promise<SmsResultado> {
    const key = process.env.VONAGE_API_KEY;
    const secret = process.env.VONAGE_API_SECRET;
    const from = process.env.VONAGE_FROM ?? process.env.SMS_FROM ?? "Impacto";
    if (!key || !secret) return { ok: false, error: "vonage_sin_configurar" };

    const cuerpo = new URLSearchParams({
      api_key: key,
      api_secret: secret,
      from,
      to: envio.to.replace(/^\+/, ""),
      text: cuerpoSms(envio),
      type: "unicode",
    });
    // VONAGE_API_BASE permite apuntar a un servidor de pruebas.
    const base = (process.env.VONAGE_API_BASE ?? "https://rest.nexmo.com").replace(/\/+$/, "");
    const r = await fetch(`${base}/sms/json`, {
      method: "POST",
      headers: { "Content-Type": "application/x-www-form-urlencoded" },
      body: cuerpo,
      cache: "no-store",
    }).catch(() => null);
    if (!r?.ok) return { ok: false, error: `vonage_${r?.status ?? "red"}` };
    const j = await r.json().catch(() => null);
    const estado = j?.messages?.[0]?.status;
    return estado === "0" ? { ok: true } : { ok: false, error: `vonage_${estado ?? "desconocido"}` };
  }
}
