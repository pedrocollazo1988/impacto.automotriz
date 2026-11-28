import { notFound } from "next/navigation";
import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { canViewOrder } from "@/lib/order-access";
import { porClave } from "@/lib/payment-gateways";
import { datosPublicos, esCobroAutomatico, redirigeAlPagar } from "@/lib/pasarelas";
import { pagoTexto } from "@/lib/pagos-i18n";
import { descripcionEntrega, instruccionesPago, nombreEntrega, nombrePago, nombreProducto } from "@/lib/datos-i18n";
import { getT } from "@/lib/i18n";
import Icon from "@/components/brand/Icon";
import PayRetry from "./PayRetry";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("order.metaTitle"), robots: { index: false } };
}

const STEPS = ["PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED"] as const;
const ICONS: Record<string, string> = { PENDING_PAYMENT: "card", PAID: "check", PREPARING: "box", SHIPPED: "truck", DELIVERED: "pin" };
const DELIVERY_KEY: Record<string, string> = { PENDING: "order.del.PENDING", READY: "order.del.READY", OUT_FOR_DELIVERY: "order.del.OUT_FOR_DELIVERY", DELIVERED: "ord.st.DELIVERED", FAILED: "order.del.FAILED" };

export default async function Pedido({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const o = await prisma.order.findUnique({
    where: { id: (await params).id },
    include: {
      items: { include: { product: { select: { slug: true, name: true, nameEn: true } } } },
      delivery: true,
    },
  });
  if (!o || !(await canViewOrder(o, (await searchParams).t))) notFound();
  const { t, lang } = await getT();
  const tok = (await searchParams).t;
  const idx = STEPS.indexOf(o.status as (typeof STEPS)[number]);
  const canceled = o.status === "CANCELED";
  const gw = await porClave(o.paymentMethod);
  // Los textos ingleses no viajan en Pasarela ni en OrderDelivery: se leen aparte.
  const [gwFila, entregaFila, variantes] = await Promise.all([
    prisma.paymentGateway.findUnique({
      where: { key: o.paymentMethod },
      select: { key: true, name: true, nameEn: true, description: true, descriptionEn: true, instructions: true, instructionsEn: true },
    }),
    o.delivery ? prisma.deliveryMethod.findUnique({ where: { id: o.delivery.methodId } }) : null,
    prisma.productVariant.findMany({
      where: { id: { in: o.items.map((i) => i.variantId).filter((v): v is number => v != null) } },
      select: { id: true, name: true },
    }),
  ]);
  const pago = {
    key: o.paymentMethod,
    name: o.paymentMethodName ?? gwFila?.name ?? gw?.name ?? o.paymentMethod,
    nameEn: gwFila?.nameEn ?? null,
    description: gwFila?.description ?? gw?.description ?? "",
    descriptionEn: gwFila?.descriptionEn ?? null,
    instructions: gwFila?.instructions ?? gw?.instructions ?? "",
    instructionsEn: gwFila?.instructionsEn ?? null,
  };
  const metodo = nombrePago(pago, lang);
  const instrucciones = instruccionesPago(pago, lang);
  const metodoEntrega = o.delivery ? (entregaFila ? nombreEntrega(entregaFila, lang) : o.delivery.methodName) : "";
  const entregaDesc = entregaFila ? descripcionEntrega(entregaFila, lang) : "";
  const nombreArticulo = (i: (typeof o.items)[number]) => {
    const base = nombreProducto({ slug: i.product.slug, name: i.product.name, nameEn: i.product.nameEn }, lang);
    const variante = variantes.find((v) => v.id === i.variantId)?.name;
    return variante ? `${base} — ${variante}` : base;
  };
  const detalles = gw ? datosPublicos(gw) : [];
  return (
    <div className="container-x py-8">
      <div className="mx-auto max-w-3xl space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div><span className="eyebrow">{t("ord.number")}</span><h1 className="mt-1 font-display text-3xl font-extrabold text-navy">#{o.number}</h1></div>
          <Link href={`/pedido/${o.id}/factura${tok ? `?t=${tok}` : ""}`} className="btn btn-ghost"><Icon name="box" size={16} /> {t("order.viewInvoice")}</Link>
        </div>

        {canceled ? (
          <div className="card border-red-200 bg-red-50 p-5 text-red-700"><p className="font-semibold">{t("order.canceledTitle")}</p><p className="mt-1 text-sm">{t("order.canceledHint")}</p></div>
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
                  <span className={`mt-2 text-[11px] font-semibold ${i <= idx ? "text-navy" : "text-slate-400"}`}>{t(`ord.st.${s}`)}</span>
                </div>
              ))}
            </div>
            <p className="mt-4 text-center text-sm text-slate-500">{t("order.currentStatus")} <b className="text-navy">{t(`ord.st.${o.status}`)}</b>{o.paid ? ` · ${t("order.paymentConfirmed")}` : ""}</p>
            <p className="mt-1 text-center text-xs text-slate-400">{t("order.paymentMethod")}: {metodo}</p>
          </div>
        )}

        <div className="card overflow-hidden">
          <h2 className="flex items-center gap-2 border-b border-slate-100 px-5 py-3 font-display text-sm font-bold text-navy"><Icon name="box" size={16} /> {t("order.articles")}</h2>
          <ul className="divide-y divide-slate-50">
            {o.items.map((i) => (
              <li key={i.id} className="flex items-center justify-between px-5 py-3 text-sm"><span>{i.qty} × {nombreArticulo(i)}</span><span className="font-semibold">{(Number(i.unitUsd) * i.qty).toFixed(2)} USD</span></li>
            ))}
          </ul>
          <div className="ml-auto w-full max-w-xs space-y-1 px-5 py-4 text-sm">
            <p className="flex justify-between"><span className="text-slate-500">{t("order.subtotal")}</span>{Number(o.subtotalUsd).toFixed(2)} USD</p>
            {Number(o.discountUsd) > 0 && <p className="flex justify-between text-emerald-700"><span>{t("order.discount")}</span>−{Number(o.discountUsd).toFixed(2)} USD</p>}
            <p className="flex justify-between"><span className="text-slate-500">{t("order.shipping")}</span>{Number(o.shippingUsd).toFixed(2)} USD</p>
            <p className="flex justify-between border-t border-slate-100 pt-2 text-base font-bold text-navy"><span>{t("order.total")}</span>{Number(o.totalUsd).toFixed(2)} USD</p>
          </div>
        </div>

        {o.delivery && (
          <div className="card p-5 text-sm">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy"><Icon name="truck" size={16} /> {t("order.delivery")}</h2>
            <p className="mt-2 text-slate-600"><b>{metodoEntrega}</b></p>
            {entregaDesc && <p className="text-slate-600">{entregaDesc}</p>}
            <p className="text-slate-600">{o.delivery.address ?? t("order.pickupInStore")}</p>
            <p className="text-slate-600">{t("order.receives")} {o.delivery.recipientName} · {o.delivery.recipientPhone}</p>
            <p className="mt-2 text-slate-600">{t("order.deliveryStatus")} <b>{DELIVERY_KEY[o.delivery.status] ? t(DELIVERY_KEY[o.delivery.status]) : o.delivery.status}</b></p>
            {!canceled && (
              <p className="mt-3 inline-flex items-center gap-2 rounded-xl bg-[color:var(--color-navy)]/8 px-3 py-2 text-navy">{t("order.deliveryPin")}: <b className="font-display text-lg tracking-widest">{o.delivery.confirmationCode}</b></p>
            )}
            {!canceled && <p className="mt-2 text-xs text-slate-500">{t("order.deliveryPinNote")}</p>}
          </div>
        )}

        {!o.paid && !canceled && gw && esCobroAutomatico(gw) && <PayRetry orderId={o.id} />}
        {!o.paid && !canceled && gw && gw.kind === "manual" && (
          <div className="card border-amber-200 bg-amber-50 p-5 text-sm text-amber-900">
            <p className="flex items-center gap-2 font-semibold"><Icon name={gw.icon} size={16} /> {t("order.howToPay")} {metodo}</p>
            {instrucciones && <p className="mt-2 whitespace-pre-line leading-relaxed">{instrucciones}</p>}
            {detalles.length > 0 && (
              <dl className="mt-3 grid gap-x-4 gap-y-1 sm:grid-cols-[auto_1fr]">
                {detalles.map((d) => (
                  <div key={d.etiqueta} className="contents">
                    <dt className="font-semibold">{pagoTexto(d.etiqueta, lang)}</dt>
                    <dd className="break-words">{d.valor}</dd>
                  </div>
                ))}
              </dl>
            )}
            <p className="mt-3">{t("order.reference").replace("{number}", String(o.number))}</p>
            {redirigeAlPagar(gw) && gw.config?.url && (
              <a href={gw.config.url} target="_blank" rel="noreferrer" className="btn btn-primary mt-3">
                <Icon name="arrowRight" size={16} /> {gw.config.referencia ? pagoTexto(gw.config.referencia, lang) : t("order.goToPay")}
              </a>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
