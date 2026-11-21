import { prisma } from "@/lib/prisma";
import { validNotification } from "@/lib/tropipay";
import { porClave } from "@/lib/payment-gateways";

// Webhook de Tropipay: marca el pedido como pagado SOLO si la firma y el importe coinciden.
export async function POST(req: Request) {
  const p = await req.json().catch(() => null);
  const data = p?.data ?? p; // algunos envíos anidan el payload en "data"
  const gw = await porClave("TROPIPAY");
  const c = gw?.creds ?? {};
  if (!gw?.enabled || !c.clientId || !c.clientSecret) return new Response("Gateway disabled", { status: 503 });
  if (!data || !validNotification(data, { clientId: c.clientId, clientSecret: c.clientSecret })) return new Response("Invalid signature", { status: 401 });
  const order = await prisma.order.findUnique({ where: { id: String(data.reference) } });
  if (!order) return new Response("Not found", { status: 404 });
  if (order.paid) return Response.json({ ok: true });
  if (Math.round(Number(order.totalUsd) * 100) !== Number(data.originalCurrencyAmount)) return new Response("Amount mismatch", { status: 422 });
  await prisma.order.update({ where: { id: order.id }, data: { paid: true, paidAt: new Date(), status: "PAID" } });
  return Response.json({ ok: true });
}
