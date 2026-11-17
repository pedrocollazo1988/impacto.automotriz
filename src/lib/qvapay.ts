// ⚠ Integración basada en la API v1 de QvaPay (create_invoice). VALIDAR endpoints, campos y estados
// contra la documentación/entorno de pruebas de QvaPay antes de producción.
const base = () => process.env.QVAPAY_BASE_URL ?? "https://qvapay.com";
export const qvapayEnabled = () => !!process.env.QVAPAY_APP_ID && !!process.env.QVAPAY_APP_SECRET;

export async function createInvoice(o: { orderId: string; number: number; totalUsd: number }) {
  const r = await fetch(`${base()}/api/v1/create_invoice`, {
    method: "POST", headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ app_id: process.env.QVAPAY_APP_ID, app_secret: process.env.QVAPAY_APP_SECRET, amount: o.totalUsd, description: `Pedido #${o.number} - Impacto Automotriz`, remote_id: o.orderId, signed: 1 }),
  });
  if (!r.ok) throw new Error(`QvaPay ${r.status}`);
  const j = await r.json(); const url = (j.signedUrl ?? j.url) as string | undefined; const uuid = (j.transaction_uuid ?? j.uuid) as string | undefined;
  if (!url || !uuid) throw new Error("QvaPay no devolvió enlace de pago");
  return { url, uuid };
}
// No se confía en el contenido de la notificación: se consulta el estado real de la factura.
export async function invoiceStatus(uuid: string) {
  const q = new URLSearchParams({ app_id: process.env.QVAPAY_APP_ID ?? "", app_secret: process.env.QVAPAY_APP_SECRET ?? "" });
  const r = await fetch(`${base()}/api/v1/transaction/${encodeURIComponent(uuid)}?${q}`, { headers: { Accept: "application/json" } });
  if (!r.ok) throw new Error(`QvaPay status ${r.status}`);
  const j = await r.json();
  return { paid: String(j.status).toLowerCase() === "paid", amount: Number(j.amount) };
}
