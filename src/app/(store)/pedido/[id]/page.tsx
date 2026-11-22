import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canViewOrder } from "@/lib/order-access";
import { porClave } from "@/lib/payment-gateways";
import { datosPublicos, esCobroAutomatico, redirigeAlPagar } from "@/lib/pasarelas";
import Icon from "@/components/brand/Icon";
import PayRetry from "./PayRetry";
export const dynamic = "force-dynamic";
export const metadata = { title: "Estado del pedido", robots: { index: false } };

const STEPS = ["PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;
const L: Record<string, string> = { PENDING_PAYMENT: "Pendiente de pago", PAID: "Pagado", PREPARING: "En preparación", SHIPPED: "Enviado", DELIVERED: "Entregado", CANCELED: "Cancelado" };
const ICONS: Record<string, string> = { PENDING_PAYMENT: "card", PAID: "check", PREPARING: "box", SHIPPED: "truck", DELIVERED: "pin" };

export default async function Pedido({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const o = await prisma.order.findUnique({ where: { id: (await params).id }, include: { items: true, delivery: true } });
  if (!o || !(await canViewOrder(o, (await searchParams).t))) notFound();
  const tok = (await searchParams).t;
  const idx = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const canceled = o.status === "CANCELED";
  const gw = await porClave(o.paymentMethod);
  const metodo = o.paymentMethodName ?? gw?.name ?? o.paymentMethod;
  const detalles = gw ? datosPublicos(gw) : [];
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><span className="eyebrow">Pedido</span><h1 className="mt-1 font-display text-3xl font-extrabold text-navy">#{o.number}</h1></div>
          <Link href={`/pedido/${o.id}/factura${tok ? `?t=${tok}` : ""}`} className="btn btn-ghost"><Icon name="box" size={16} /> Ver comprobante</Link>
        </div>

        {canceled ? (
          <div className="card border-red-200 bg-red-50 p-5 text-red-700"><p className="font-semibold">Pedido cancelado</p><p className="mt-1 text-sm">Si crees que es un error, contáctanos por WhatsApp.</p></div>
        ) : (
          <div className="card p-6">
            <div className="flex items-center justify-between">
              {STEPS.map((s, i) => (
                <div key={s} className="flex flex-1 flex-col items-center text-center">
                  <div className="flex w-full items-center">
                    <span className={`h-0.5 flex-1 ${i === 0 ? "bg-transparent" : i <= idx ? "bg-[color:var(--color-action)]" : "bg-slate-200"}`} />
                    <span className={`grid h-10 w-10 shrink-0 place-items-center rounded-full border-2 ${i <= idx ? "border-[color:var(--color-action)] bg-[color:var(--color-action)] text-white" : "border-slate-200 bg-white text-slate-300"}`}>
                      <Icon name={ICONS[s]} size={18} />
                    </span>
                    <span className={`h-0.5 flex-1 ${i === STEPS.length - 1 ? "bg-transparent" : i < idx ? "bg-[color:var(--color-action)]" : "bg-slate-200"}`} />
                  </div>
                  <span className={`mt-2 text-[11px] font-semibold ${i <= idx ? "text-navy" : "text-slate-400"}`}>{L[s]}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">Estado actual: <b className="text-navy">{L[o.status]}</b>{o.paid ? " · pago confirmado" : ""}</p>
            <p className="mt-1 text-center text-xs text-slate-400">Método de pago: {metodo}</p>
          </div>
        )}

        <div className="card overflow-hidden">
          <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 font-display text-sm font-bold text-navy"><Icon name="box" size={16} /> Artículos</h2>
          <ul className="divide-y divide-slate-50">
            {o.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-5 py-3 text-sm"><span>{i.qty} × {i.name}</span><span className="font-semibold">{(Number(i.unitUsd) * i.qty).toFixed(2)} USD</span></li>
            ))}
          </ul>
          <div className="ml-auto w-full max-w-xs space-y-1 px-5 py-4 text-sm">
            <p className="flex justify-between"><span className="text-slate-500">Subtotal</span>{Number(o.subtotalUsd).toFixed(2)} USD</p>
            {Number(o.discountUsd) > 0 && <p className="flex justify-between text-emerald-700"><span>Descuento</span>−{Number(o.discountUsd).toFixed(2)} USD</p>}
            <p className="flex justify-between"><span className="text-slate-500">Envío</span>{Number(o.shippingUsd).toFixed(2)} USD</p>
            <p className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-navy"><span>Total</span>{Number(o.totalUsd).toFixed(2)} USD</p>
          </div>
        </div>

        {o.delivery && (
          <div className="card p-5 text-sm">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy"><Icon name="truck" size={16} /> Entrega</h2>
            <p className="mt-2 text-slate-600"><b>{o.delivery.methodName}</b></p>
            <p className="text-slate-600">{o.delivery.address ?? "Recogida en tienda"}</p>
            <p className="text-slate-600">Recibe: {o.delivery.recipientName} · {o.delivery.recipientPhone}</p>
            <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-navy)]/8 px-3 py-2 text-navy">PIN de entrega: <b className="font-display text-lg tracking-widest">{o.delivery.confirmationCode}</b></p>
          </div>
        )}

        {!o.paid && !canceled && gw && esCobroAutomatico(gw) && <PayRetry orderId={o.id} />}
        {!o.paid && !canceled && gw && gw.kind === "manual" && (
          <div className="card border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-semibold"><Icon name={gw.icon} size={16} /> Cómo pagar con {metodo}</p>
            {gw.instructions && <p className="mt-2 whitespace-pre-line leading-relaxed">{gw.instructions}</p>}
            {detalles.length > 0 && (
              <dl className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
                {detalles.map((d) => (
                  <div key={d.etiqueta} className="contents">
                    <dt className="font-semibold">{d.etiqueta}</dt>
                    <dd className="break-words">{d.valor}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-3">Referencia: Pedido #{o.number}. Confirmaremos el pago manualmente.</p>
            {redirigeAlPagar(gw) && gw.config?.url && (
              <a href={gw.config.url} target="_blank" rel="noreferrer" className="btn btn-primary mt-3">
                <Icon name="arrowRight" size={16} /> {gw.config.referencia || "Ir a pagar"}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
