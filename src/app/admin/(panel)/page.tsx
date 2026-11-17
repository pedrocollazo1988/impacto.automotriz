import { prisma } from "@/lib/prisma";
import OrderActions from "./OrderActions";
import { requirePage } from "@/lib/auth";
export const dynamic = "force-dynamic";

export default async function Pedidos() {
  await requirePage("orders");
  const orders = await prisma.order.findMany({ orderBy: { id: "desc" }, take: 50, include: { items: true, delivery: true } });
  return (
    <main className="mx-auto max-w-6xl p-6"><h1 className="mb-4 text-2xl font-bold text-navy">Pedidos</h1>
      <div className="space-y-3">{orders.map((o) => (
        <div key={o.id} className="rounded-lg border p-4 text-sm">
          <div className="flex flex-wrap justify-between gap-2"><b>#{o.number} · {o.customerName}</b><span>{Number(o.totalUsd).toFixed(2)} USD · {o.paymentMethod} · {o.paid ? "PAGADO" : "sin pagar"} · <b>{o.status}</b></span></div>
          <p className="text-slate-500">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
          {o.delivery && <p className="text-slate-500">{o.delivery.methodName} · {o.delivery.address ?? "recogida"} · {o.customerPhone}</p>}
          <OrderActions id={o.id} paid={o.paid} status={o.status} />
        </div>))}</div>
    </main>);
}
