import { createPaymentLink } from "./tropipay";
import { createInvoice } from "./qvapay";
import { esCobroAutomatico, type Pasarela } from "./pasarelas";

type PasarelaConCreds = Pasarela & { creds: Record<string, string> | null };

// Puerta única al cobro en línea. El driver de la pasarela decide qué API se
// llama; la clave del método puede ser cualquiera y se puede renombrar sin
// tocar este archivo. Las credenciales vienen cifradas de la base de datos.
export async function createOnlinePayment(o: {
  id: string;
  number: number;
  totalUsd: number;
  gateway: PasarelaConCreds;
}): Promise<{ url: string; ref?: string }> {
  const gw = o.gateway;
  if (!gw.enabled || gw.archived) throw new Error(`El método ${gw.name} está desactivado`);
  if (!esCobroAutomatico(gw)) throw new Error(`El método ${gw.name} no tiene cobro automático`);

  // `config` manda sobre las filas antiguas que guardaban los campos públicos
  // dentro de las credenciales cifradas.
  const c = { ...(gw.creds ?? {}), ...(gw.config ?? {}) };
  if (gw.provider === "qvapay") {
    if (!c.appId || !c.appSecret) throw new Error("QvaPay no tiene credenciales configuradas");
    const r = await createInvoice({ orderId: o.id, number: o.number, totalUsd: o.totalUsd, creds: { appId: c.appId, appSecret: c.appSecret } });
    return { url: r.url, ref: r.uuid };
  }
  if (gw.provider === "tropipay") {
    if (!c.clientId || !c.clientSecret) throw new Error("Tropipay no tiene credenciales configuradas");
    const url = await createPaymentLink({
      orderId: o.id,
      number: o.number,
      totalUsd: o.totalUsd,
      sandbox: gw.sandbox,
      creds: { clientId: c.clientId, clientSecret: c.clientSecret, reasonId: c.reasonId },
    });
    return { url };
  }
  throw new Error(`El método ${gw.name} no tiene cobro automático`);
}
