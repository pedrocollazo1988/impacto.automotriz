import type { SmsEnvio, SmsProvider, SmsResultado } from "./index";

/**
 * WhatsApp Cloud API (Meta). Fuera de una conversación abierta solo se pueden
 * enviar plantillas aprobadas, así que el código viaja como parámetro {{1}} del
 * cuerpo. La API espera el teléfono sin el signo "+".
 *
 * Es la vía que mejor funciona en Cuba: el mensaje viaja por datos y no depende
 * de la red de SMS, que es la que los agregadores suelen tener restringida.
 */
export class WhatsappSms implements SmsProvider {
  readonly nombre = "whatsapp";

  async enviarCodigo(envio: SmsEnvio): Promise<SmsResultado> {
    const token = process.env.WHATSAPP_TOKEN;
    const phoneId = process.env.WHATSAPP_PHONE_ID;
    if (!token || !phoneId) return { ok: false, error: "whatsapp_sin_configurar" };

    // La prueba del panel usa su propia plantilla si existe; si no, la de
    // códigos con un valor evidente para no confundir a quien la reciba.
    const prueba = !!envio.texto;
    const nombre = (prueba ? process.env.WHATSAPP_TEMPLATE_PRUEBA : undefined) || process.env.WHATSAPP_TEMPLATE || "codigo_acceso";
    const idioma = process.env.WHATSAPP_TEMPLATE_LANG || "es";
    const conParametro = !(prueba && process.env.WHATSAPP_TEMPLATE_PRUEBA);

    // WHATSAPP_API_BASE permite apuntar a un servidor de pruebas.
    const base = (process.env.WHATSAPP_API_BASE ?? "https://graph.facebook.com").replace(/\/+$/, "");
    const version = process.env.WHATSAPP_API_VERSION || "v21.0";
    const r = await fetch(`${base}/${version}/${phoneId}/messages`, {
      method: "POST",
      headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
      body: JSON.stringify({
        messaging_product: "whatsapp",
        recipient_type: "individual",
        to: envio.to.replace(/^\+/, ""),
        type: "template",
        template: {
          name: nombre,
          language: { code: idioma },
          ...(conParametro ? { components: [{ type: "body", parameters: [{ type: "text", text: prueba ? "000000" : envio.codigo }] }] } : {}),
        },
      }),
      cache: "no-store",
    }).catch(() => null);
    if (!r?.ok) return { ok: false, error: `whatsapp_${r?.status ?? "red"}` };
    return { ok: true };
  }
}
