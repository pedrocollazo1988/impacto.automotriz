import { prisma } from "@/lib/prisma";
import OrderActions from "./OrderActions";
import { requirePage } from "@/lib/auth";
import { PageHeader, EmptyState, Badge } from "@/components/admin/ui";
export const dynamic = "force-dynamic";

const STATUS: Record<string, { label: string; tone: "ok" | "warn" | "info" | "danger" | "mute" }> = {
  PENDING_PAYMENT: { label: "Pendiente de pago", tone: "warn" },
  PAID: { label: "Pagado", tone: "ok" },
  PREPARING: { label: "En preparación", tone: "info" },
  SHIPPED: { label: "Enviado", tone: "info" },
  DELIVERED: { label: "Entregado", tone: "ok" },
  CANCELED: { label: "Cancelado", tone: "danger" },
};

export default async function Pedidos() {
  const u = await requirePage("orders");
  const orders = await prisma.order.findMany({ orderBy: { id: "desc" }, take: 50, include: { items: true, delivery: true } });
  return (
    <>
      <PageHeader title="Pedidos" subtitle={`${orders.length} pedido${orders.length === 1 ? "" : "s"} recientes`} />
      {!orders.length ? (
        <EmptyState icon="box" title="Todavía no hay pedidos" hint="Cuando un cliente compre, su pedido aparecerá aquí." />
      ) : (
        <div className="space-y-3">{orders.map((o) => {
          const st = STATUS[o.status] ?? { label: o.status, tone: "mute" as const };
          return (
            <div key={o.id} className="adm-panel adm-panel-pad text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-navy">#{o.number} · {o.customerName}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <b>{Number(o.totalUsd).toFixed(2)} USD</b>
                  <Badge tone={o.paid ? "ok" : "warn"}>{o.paid ? "Pagado" : "Sin pagar"}</Badge>
                  <Badge tone={st.tone}>{st.label}</Badge>
                  <a href={`/admin/pedidos/${o.id}/prefactura`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs">
                    Prefactura
                  </a>
                </span>
              </div>
              <p className="mt-1 text-slate-500">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
              <p className="text-slate-500">{o.delivery ? `${o.delivery.methodName} · ${o.delivery.address ?? "recogida"} · ${o.customerPhone}` : `Pago: ${o.paymentMethodName ?? o.paymentMethod}`}</p>
              <OrderActions id={o.id} paid={o.paid} status={o.status} items={o.items.map((i) => ({ id: i.id, name: i.name, qty: i.qty }))} puedeQuitar={u.role === "ADMIN"} />
            </div>
          );
        })}</div>
      )}
    </>);
}
