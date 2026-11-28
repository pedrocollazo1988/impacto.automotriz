import { prisma } from "@/lib/prisma";
import OrderActions from "./OrderActions";
import { requirePage } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import { PageHeader, EmptyState, Badge } from "@/components/admin/ui";
export const dynamic = "force-dynamic";

const STATUS: Record<string, "ok" | "warn" | "info" | "danger" | "mute"> = {
  PENDING_PAYMENT: "warn",
  PAID: "ok",
  PREPARING: "info",
  SHIPPED: "info",
  DELIVERED: "ok",
  CANCELED: "danger",
};

export default async function Pedidos() {
  const u = await requirePage("orders");
  const { t } = await getT();
  const orders = await prisma.order.findMany({ orderBy: { id: "desc" }, take: 50, include: { items: true, delivery: true } });
  const estado = (valor: string) => {
    const clave = `ord.st.${valor}`;
    const texto = t(clave);
    return texto === clave ? valor : texto;
  };
  return (
    <>
      <PageHeader title={t("adm.pedidos.title")} subtitle={t(orders.length === 1 ? "adm.pedidos.recentOne" : "adm.pedidos.recentPlural").replace("{n}", String(orders.length))} />
      {!orders.length ? (
        <EmptyState icon="box" title={t("adm.pedidos.emptyTitle")} hint={t("adm.pedidos.emptyHint")} />
      ) : (
        <div className="space-y-3">{orders.map((o) => {
          const tono = STATUS[o.status] ?? "mute";
          return (
            <div key={o.id} className="adm-panel adm-panel-pad text-sm">
              <div className="flex flex-wrap items-center justify-between gap-2">
                <span className="font-semibold text-navy">#{o.number} · {o.customerName}</span>
                <span className="flex flex-wrap items-center gap-2">
                  <b>{Number(o.totalUsd).toFixed(2)} USD</b>
                  <Badge tone={o.paid ? "ok" : "warn"}>{o.paid ? t("ord.st.PAID") : t("adm.pedidos.unpaid")}</Badge>
                  <Badge tone={tono}>{estado(o.status)}</Badge>
                  <a href={`/admin/pedidos/${o.id}/prefactura`} target="_blank" rel="noopener noreferrer" className="btn btn-ghost btn-xs">
                    {t("order.invoiceMeta")}
                  </a>
                </span>
              </div>
              <p className="mt-1 text-slate-500">{o.items.map((i) => `${i.qty}× ${i.name}`).join(", ")}</p>
              <p className="text-slate-500">{o.delivery ? `${o.delivery.methodName} · ${o.delivery.address ?? t("adm.pedidos.pickupShort")} · ${o.customerPhone}` : `${t("order.payment")}: ${o.paymentMethodName ?? o.paymentMethod}`}</p>
              <OrderActions id={o.id} paid={o.paid} status={o.status} items={o.items.map((i) => ({ id: i.id, name: i.name, qty: i.qty }))} puedeQuitar={u.role === "ADMIN"} />
            </div>
          );
        })}</div>
      )}
    </>);
}
