import { cuerpoSms, type SmsEnvio, type SmsProvider, type SmsResultado } from "./index";

/**
 * Twilio Programmable SMS (Messages API). Se envía nuestro propio código, no
 * Verify, porque las reglas de intentos, caducidad y hash viven en nuestra
 * base de datos. Para usar Verify basta con crear otro adaptador que delegue
 * en /v2/Services/{Sid}/Verifications.
 */
export class TwilioSms implements SmsProvider {
  readonly nombre = "twilio";

  async enviarCodigo(envio: SmsEnvio): Promise<SmsResultado> {
    const sid = process.env.TWILIO_ACCOUNT_SID;
    const token = process.env.TWILIO_AUTH_TOKEN;
    const from = process.env.TWILIO_FROM;
    const servicio = process.env.TWILIO_MESSAGING_SERVICE_SID;
    if (!sid || !token || (!from && !servicio)) return { ok: false, error: "twilio_sin_configurar" };

    const cuerpo = new URLSearchParams({ To: envio.to, Body: cuerpoSms(envio) });
    if (servicio) cuerpo.set("MessagingServiceSid", servicio);
    else cuerpo.set("From", from!);

    // TWILIO_API_BASE permite apuntar a un servidor de pruebas.
    const base = (process.env.TWILIO_API_BASE ?? "https://api.twilio.com").replace(/\/+$/, "");
    const r = await fetch(`${base}/2010-04-01/Accounts/${sid}/Messages.json`, {
      method: "POST",
      headers: {
        Authorization: `Basic ${Buffer.from(`${sid}:${token}`).toString("base64")}`,
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: cuerpo,
      cache: "no-store",
    }).catch(() => null);
    if (!r?.ok) return { ok: false, error: `twilio_${r?.status ?? "red"}` };
    return { ok: true };
  }
}
