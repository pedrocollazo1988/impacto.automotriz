import { prisma } from "@/lib/prisma";
import { validNotification } from "@/lib/tropipay";
import { porClave } from "@/lib/payment-gateways";
import { sendTransactional } from "@/lib/mailer";
import { orderStatusEmail } from "@/lib/email-templates";
import { emailLang, emailT } from "@/lib/email-i18n";
import { orderToken } from "@/lib/order-access";

// Webhook de Tropipay: marca el pedido como pagado SOLO si la firma y el importe coinciden.
export async function POST(req: Request) {
  const p = await req.json().catch(() => null);
  const data = p?.data ?? p; // algunos envíos anidan el payload en "data"
  if (!data?.reference) return new Response("Not found", { status: 404 });
  const order = await prisma.order.findUnique({ where: { id: String(data.reference) } });
  if (!order) return new Response("Not found", { status: 404 });
  const gw = await porClave(order.paymentMethod);
  if (!gw || gw.provider !== "tropipay") return new Response("Not found", { status: 404 });
  const c = { ...(gw.creds ?? {}), ...(gw.config ?? {}) };
  if (!gw.enabled || gw.archived || !c.clientId || !c.clientSecret) return new Response("Gateway disabled", { status: 503 });
  if (!validNotification(data, { clientId: c.clientId, clientSecret: c.clientSecret })) return new Response("Invalid signature", { status: 401 });
  if (order.paid) return Response.json({ ok: true });
  if (Math.round(Number(order.totalUsd) * 100) !== Number(data.originalCurrencyAmount)) return new Response("Amount mismatch", { status: 422 });
  await prisma.order.update({ where: { id: order.id }, data: { paid: true, paidAt: new Date(), status: "PAID" } });
  const lang = emailLang(order.lang);
  await sendTransactional(order.customerEmail, emailT(lang, "status.subject", { number: order.number, status: emailT(lang, "status.PAID") }), orderStatusEmail({
    name: order.customerName, orderNumber: order.number, status: "PAID",
    trackingUrl: `${process.env.PUBLIC_URL}/pedido/${order.id}?t=${orderToken(order.id)}`, lang,
  })).catch(() => null);
  return Response.json({ ok: true });
}
