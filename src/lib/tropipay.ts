import crypto from "node:crypto";

// ⚠ Integración basada en la API v2 de Tropipay. VALIDAR cada endpoint, campo y la firma
// contra la documentación y el entorno sandbox antes de pasar a producción.
const base = () => process.env.TROPIPAY_BASE_URL ?? "https://www.tropipay-dev.com";

async function token() {
  const r = await fetch(`${base()}/api/v2/access/token`, {
    method: "POST", headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ grant_type: "client_credentials", client_id: process.env.TROPIPAY_CLIENT_ID, client_secret: process.env.TROPIPAY_CLIENT_SECRET }),
  });
  if (!r.ok) throw new Error(`Tropipay auth ${r.status}`);
  return (await r.json()).access_token as string;
}

export async function createPaymentLink(o: { orderId: string; number: number; totalUsd: number }) {
  const url = process.env.PUBLIC_URL;
  const r = await fetch(`${base()}/api/v2/paymentcards`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${await token()}` },
    body: JSON.stringify({
      reference: o.orderId, concept: `Pedido #${o.number}`, description: `Pedido #${o.number} - Impacto Automotriz`,
      amount: Math.round(o.totalUsd * 100), currency: "USD", singleUse: true, reasonId: Number(process.env.TROPIPAY_REASON_ID ?? 4),
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
export function validNotification(p: { bankOrderCode?: string; originalCurrencyAmount?: number | string; signature?: string }) {
  if (!p.bankOrderCode || p.originalCurrencyAmount == null || !p.signature) return false;
  const expected = crypto.createHash("sha256").update(`${p.bankOrderCode}${process.env.TROPIPAY_CLIENT_ID}${process.env.TROPIPAY_CLIENT_SECRET}${p.originalCurrencyAmount}`).digest("hex");
  const a = Buffer.from(expected), b = Buffer.from(String(p.signature));
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}
