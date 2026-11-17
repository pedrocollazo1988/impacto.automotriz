import { prisma } from "@/lib/prisma";
import { invoiceStatus } from "@/lib/qvapay";

// Webhook de QvaPay: NO se confía en el cuerpo; se vuelve a consultar el estado de la factura y se compara el importe.
export async function POST(req: Request) {
  const p = await req.json().catch(() => null);
  const orderId = String(p?.remote_id ?? "");
  const order = orderId ? await prisma.order.findUnique({ where: { id: orderId } }) : null;
  if (!order || order.paymentMethod !== "QVAPAY" || !order.providerRef) return new Response("Not found", { status: 404 });
  if (order.paid) return Response.json({ ok: true });
  try {
    const s = await invoiceStatus(order.providerRef);
    if (!s.paid) return Response.json({ ok: true, paid: false });
    if (Math.abs(s.amount - Number(order.totalUsd)) > 0.01) return new Response("Amount mismatch", { status: 422 });
    await prisma.order.update({ where: { id: order.id }, data: { paid: true, paidAt: new Date(), status: "PAID" } });
    return Response.json({ ok: true });
  } catch { return new Response("Verification failed", { status: 502 }); }
}
