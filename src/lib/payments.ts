import { createPaymentLink } from "./tropipay";
import { createInvoice } from "./qvapay";
import { porClave } from "./payment-gateways";

// Puerta única al cobro en línea. Las credenciales ya no se leen del entorno:
// vienen de la pasarela configurada en el panel, cifradas en la base de datos.
export async function createOnlinePayment(o: { id: string; number: number; totalUsd: number; method: "TROPIPAY" | "QVAPAY" }): Promise<{ url: string; ref?: string }> {
  const gw = await porClave(o.method);
  if (!gw?.enabled) throw new Error(`La pasarela ${o.method} está desactivada`);
  const c = gw.creds ?? {};
  if (o.method === "QVAPAY") {
    if (!c.appId || !c.appSecret) throw new Error("QvaPay no tiene credenciales configuradas");
    const r = await createInvoice({ orderId: o.id, number: o.number, totalUsd: o.totalUsd, creds: { appId: c.appId, appSecret: c.appSecret } });
    return { url: r.url, ref: r.uuid };
  }
  if (!c.clientId || !c.clientSecret) throw new Error("Tropipay no tiene credenciales configuradas");
  const url = await createPaymentLink({ orderId: o.id, number: o.number, totalUsd: o.totalUsd, sandbox: gw.sandbox,
    creds: { clientId: c.clientId, clientSecret: c.clientSecret, reasonId: c.reasonId } });
  return { url };
}
