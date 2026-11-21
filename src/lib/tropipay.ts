import crypto from "node:crypto";

// ⚠ Integración basada en la API v2 de Tropipay. VALIDAR cada endpoint, campo y la firma
// contra la documentación y el entorno sandbox antes de pasar a producción.
//
// Las credenciales llegan por parámetro (las gestiona el panel y se guardan
// cifradas). `sandbox` elige el host salvo que se fije TROPIPAY_BASE_URL.
export type TropipayCreds = { clientId: string; clientSecret: string; reasonId?: string };

const base = (sandbox: boolean) =>
  process.env.TROPIPAY_BASE_URL ?? (sandbox ? "https://www.tropipay-dev.com" : "https://www.tropipay.com");

async function token(c: TropipayCreds, sandbox: boolean) {
  const r = await fetch(`${base(sandbox)}/api/v2/access/token`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: c.clientId, client_secret: c.clientSecret }),
  });
  if (!r.ok) throw new Error(`Tropipay auth ${r.status}`);
  return (await r.json()).access_token as string;
}

export async function createPaymentLink(o: { orderId: string; number: number; totalUsd: number; creds: TropipayCreds; sandbox: boolean }) {
  const url = process.env.PUBLIC_URL;
  const r = await fetch(`${base(o.sandbox)}/api/v2/paymentcards`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token(o.creds, o.sandbox)}` },
    body: JSON.stringify({
      reference: o.orderId, concept: `Pedido #${o.number}`, description: `Pedido #${o.number} - Impacto Automotriz`,
      amount: Math.round(o.totalUsd * 100), currency: "USD", singleUse: true, reasonId: Number(o.creds.reasonId ?? 4),
      expirationDays: 1, lang: "es", urlSuccess: `${url}/pedido/${o.orderId}`, urlFailed: `${url}/pedido/${o.orderId}`,
      urlNotification: `${url}/api/payments/tropipay/notify`, serviceDate: new Date().toISOString().slice(0, 10), directPayment: true,
    }),
  });
  if (!r.ok) throw new Error(`Tropipay link ${r.status}`);
  const j = await r.json();
  const link = (j.shortUrl ?? j.paymentUrl) as string | undefined;
  if (!link) throw new Error("Tropipay no devolvió enlace de pago");
  return link;
}

// Firma de la notificación: sha256(bankOrderCode + clientId + clientSecret + originalCurrencyAmount)
export function validNotification(p: { bankOrderCode?: string; originalCurrencyAmount?: number | string; signature?: string }, c: TropipayCreds) {
  if (!p.bankOrderCode || p.originalCurrencyAmount == null || !p.signature) return false;
  const expected = crypto.createHash("sha256").update(`${p.bankOrderCode}${c.clientId}${c.clientSecret}${p.originalCurrencyAmount}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(p.signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
