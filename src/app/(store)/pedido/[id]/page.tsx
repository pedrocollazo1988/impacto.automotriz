import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import PayRetry from "./PayRetry";
export const dynamic = "force-dynamic";
export const metadata = { title: "Estado del pedido", robots: { index: false } };

const L: Record<string, string> = { PENDING_PAYMENT: "Pendiente de pago", PAID: "Pagado", PREPARING: "En preparación", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELED: "Cancelado" };
export default async function Pedido({ params }: { params: Promise<{ id: string }> }) {
  const o = await prisma.order.findUnique({ where: { id: (await params).id }, include: { items: true, delivery: true } });
  if (!o) notFound();
  return (
    <div className="mx-auto max-w-2xl space-y-4"><h1 className="text-2xl font-bold text-navy">Pedido #{o.number}</h1>
      <p className="rounded-lg bg-slate-50 p-3">Estado: <b>{L[o.status]}</b>{o.paid ? " · pago confirmado" : ""}</p>
      <ul className="divide-y rounded-lg border text-sm">{o.items.map((i) => <li key={i.id} className="flex justify-between p-3"><span>{i.qty} × {i.name}</span><span>{(Number(i.unitUsd) * i.qty).toFixed(2)} USD</span></li>)}</ul>
      <p className="text-right font-bold">Total: {Number(o.totalUsd).toFixed(2)} USD <span className="font-normal text-slate-500">(envío {Number(o.shippingUsd).toFixed(2)}{Number(o.discountUsd) > 0 ? `, descuento −${Number(o.discountUsd).toFixed(2)}` : ""})</span></p>
      {o.delivery && <div className="rounded-lg border p-3 text-sm"><b>{o.delivery.methodName}</b><br />{o.delivery.address ?? "Recogida en tienda"}<br />Recibe: {o.delivery.recipientName} · {o.delivery.recipientPhone}<br />PIN de entrega: <b className="text-lg">{o.delivery.confirmationCode}</b></div>}
      <a className="text-sm text-navy underline" href={`/pedido/${o.id}/factura`}>Ver comprobante</a>
      {!o.paid && o.status !== "CANCELED" && (o.paymentMethod === "TROPIPAY" || o.paymentMethod === "QVAPAY") && <PayRetry orderId={o.id} />}
      {!o.paid && o.paymentMethod === "TRANSFER" && <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm"><b>Datos para la transferencia:</b><br />{process.env.BANK_INSTRUCTIONS}<br />Referencia: Pedido #{o.number}. Confirmaremos el pago manualmente.</div>}
    </div>);
}
