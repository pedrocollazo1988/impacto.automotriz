import { plantillaSms, type SmsEnvio, type SmsProvider, type SmsResultado } from "./index";

/**
 * Proveedor de desarrollo: no envía nada, imprime el código en la consola del
 * servidor. Con SMS_MOCK_ECHO=true lo devuelve también al cliente para poder
 * probar el flujo sin teléfono (nunca se activa en producción).
 */
export class MockSms implements SmsProvider {
  readonly nombre = "mock";

  async enviarCodigo({ to, codigo, lang }: SmsEnvio): Promise<SmsResultado> {
    console.info(`[sms:mock] ${to} → ${plantillaSms(lang, codigo)}`);
    const eco = process.env.SMS_MOCK_ECHO === "true" && process.env.NODE_ENV !== "production";
    return { ok: true, ...(eco ? { debugCode: codigo } : {}) };
  }
}
