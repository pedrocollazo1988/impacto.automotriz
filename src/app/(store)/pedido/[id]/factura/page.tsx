import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canViewOrder } from "@/lib/order-access";
import PrintButton from "@/components/PrintButton";
export const dynamic = "force-dynamic";
export const metadata = { title: "Comprobante", robots: { index: false } };

// Comprobante imprimible: «Imprimir → Guardar como PDF» en el navegador.
export default async function Factura({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const o = await prisma.order.findUnique({ where: { id: (await params).id }, include: { items: true, delivery: true } });
  if (!o || !(await canViewOrder(o, (await searchParams).t))) notFound();
  const m = (n: unknown) => `${Number(n).toFixed(2)} USD`;
  return (
    <div className="mx-auto max-w-2xl space-y-4 text-sm">
      <div className="flex items-start justify-between"><div><h1 className="text-2xl font-bold text-navy">Comprobante de pedido #{o.number}</h1><p className="text-slate-500">Impacto Automotriz S.U.R.L. · {o.createdAt.toLocaleDateString("es-CU")}</p></div><PrintButton /></div>
      <p>Cliente: <b>{o.customerName}</b> · {o.customerEmail} · {o.customerPhone}</p>
      {o.delivery && <p>Entrega: {o.delivery.methodName}{o.delivery.address ? ` · ${o.delivery.address}` : ""} · Recibe: {o.delivery.recipientName}</p>}
      <table className="w-full"><thead className="border-b text-left"><tr><th>Producto</th><th>Cant.</th><th>Precio</th><th className="text-right">Importe</th></tr></thead>
        <tbody>{o.items.map((i) => <tr key={i.id} className="border-b"><td className="py-1">{i.name}</td><td>{i.qty}</td><td>{m(i.unitUsd)}</td><td className="text-right">{m(Number(i.unitUsd) * i.qty)}</td></tr>)}</tbody></table>
      <div className="ml-auto w-56 space-y-1"><p className="flex justify-between"><span>Subtotal</span>{m(o.subtotalUsd)}</p>
        {Number(o.discountUsd) > 0 && <p className="flex justify-between"><span>Descuento {o.couponCode}</span>−{m(o.discountUsd)}</p>}
        <p className="flex justify-between"><span>Envío</span>{m(o.shippingUsd)}</p><p className="flex justify-between border-t pt-1 text-base font-bold"><span>Total</span>{m(o.totalUsd)}</p></div>
      <p className="text-xs text-slate-500">Estado del pago: {o.paid ? "pagado" : "pendiente"} · Método: {o.paymentMethodName ?? o.paymentMethod}</p>
    </div>);
}
