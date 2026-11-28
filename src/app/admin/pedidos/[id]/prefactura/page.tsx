import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/auth";
import { leerSeccion } from "@/lib/contenido-server";
import { pagoTexto } from "@/lib/pagos-i18n";
import { getT } from "@/lib/i18n";
import { SITE } from "@/lib/site";
import PrintButton from "@/components/PrintButton";
import Logo from "@/components/brand/Logo";

export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("order.invoiceMeta"), robots: { index: false } };
}

const ESTADO_ENTREGA: Record<string, string> = {
  PENDING: "adm.pedidos.del.PENDING",
  READY: "order.del.READY",
  OUT_FOR_DELIVERY: "order.del.OUT_FOR_DELIVERY",
  DELIVERED: "ord.st.DELIVERED",
  FAILED: "adm.pedidos.del.FAILED",
};

const TIPO_ENTREGA: Record<string, string> = {
  HOME_DELIVERY: "adm.pedidos.kind.HOME_DELIVERY",
  STORE_PICKUP: "order.pickupInStore",
  COURIER: "adm.pedidos.kind.COURIER",
  AGREED_POINT: "adm.pedidos.kind.AGREED_POINT",
};

const money = (n: unknown) => `${Number(n ?? 0).toFixed(2)} USD`;
const ZONA = "America/Havana";
const fecha = (d: Date) => d.toLocaleDateString("es-CU", { day: "2-digit", month: "2-digit", year: "numeric", timeZone: ZONA });
const hora = (d: Date) => d.toLocaleTimeString("es-CU", { hour: "2-digit", minute: "2-digit", timeZone: ZONA });
const fechaHora = (d: Date) => `${fecha(d)} · ${hora(d)}`;

function Dato({ label, value }: { label: string; value?: ReactNode }) {
  const vacio = value === undefined || value === null || value === "";
  return (
    <div className="flex gap-1">
      <dt className="shrink-0 font-semibold text-slate-500">{label}:</dt>
      <dd className="min-w-0 break-words text-slate-700">{vacio ? "—" : value}</dd>
    </div>
  );
}

function Titulo({ children }: { children: ReactNode }) {
  return <p className="mb-1 font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">{children}</p>;
}

// Prefactura completa para el equipo. Vive fuera del grupo (panel) para que la
// impresión salga sin barra lateral; el navegador la convierte en PDF con
// «Imprimir → Guardar como PDF». No sustituye a la factura fiscal.
export default async function PrefacturaAdmin({ params }: { params: Promise<{ id: string }> }) {
  await requirePage("orders");
  const { id } = await params;
  const { t, lang } = await getT();
  const tr = (clave: string | undefined, respaldo: string) => {
    if (!clave) return respaldo;
    const texto = t(clave);
    return texto === clave ? respaldo : texto;
  };

  const [o, datos] = await Promise.all([
    prisma.order.findUnique({
      where: { id },
      include: { items: { include: { product: { select: { sku: true } } } }, delivery: true },
    }),
    leerSeccion("facturacion").catch(() => null),
  ]);
  if (!o) notFound();

  const d = o.delivery;
  const [provincia, municipio, punto, franja] = d
    ? await Promise.all([
        prisma.province.findUnique({ where: { id: d.provinceId }, select: { name: true, code: true } }),
        prisma.municipality.findUnique({ where: { id: d.municipalityId }, select: { name: true } }),
        d.pickupPointId ? prisma.pickupPoint.findUnique({ where: { id: d.pickupPointId }, select: { name: true, address: true, phone: true, hours: true } }) : null,
        d.slotId ? prisma.deliverySlot.findUnique({ where: { id: d.slotId }, select: { label: true } }) : null,
      ])
    : [null, null, null, null];

  const filas = (datos?.items ?? []).filter((i) => i.titulo);
  const valor = (nombre: string) => {
    const buscado = nombre.trim().toLowerCase();
    const fila =
      filas.find((i) => i.titulo?.trim().toLowerCase() === buscado) ??
      filas.find((i) => i.titulo?.toLowerCase().includes(buscado));
    return fila?.texto?.trim() ?? "";
  };
  const cuentaCup = valor("Cuenta bancaria CUP");
  const cuentaUsd = valor("Cuenta bancaria USD");
  const representante = valor("Representante legal");
  const emitidoPor = valor("Emitido por") || SITE.razonSocial;
  const recibidoPor = valor("Recibido por") || o.customerName;
  const lineas = o.items.reduce((s, i) => s + Number(i.unitUsd) * i.qty, 0);
  const totalPiezas = o.items.reduce((s, i) => s + i.qty, 0);
  const hayComision = Number(o.paymentFeeUsd) > 0;
  const hayDescuento = Number(o.discountUsd) > 0;
  const envioEntrega = d ? Number(d.feeUsd) : null;

  return (
    <div className="min-h-screen bg-slate-100 print:bg-white">
      <div className="factura mx-auto my-6 max-w-[210mm] bg-white p-6 text-[12px] leading-snug text-slate-700 shadow-sm print:my-0 print:max-w-none print:p-0 print:shadow-none">
        <div className="mb-4 flex flex-wrap items-center justify-between gap-2 print:hidden">
          <Link href="/admin" className="rounded border border-slate-300 px-3 py-1.5 text-sm font-semibold text-navy hover:bg-slate-50">
            ← {t("adm.pedidos.backToOrders")}
          </Link>
          <PrintButton />
        </div>

        {/* Cabecera */}
        <div className="flex items-start justify-between gap-6 border-b-2 border-navy pb-3">
          <div className="min-w-0">
            <Logo href={null} size="md" tagline={false} className="mb-1" />
            <p className="text-[11px] text-slate-500">{valor("Domicilio social") || SITE.direccion}</p>
            <p className="text-[11px] text-slate-500">{valor("Teléfonos")} · {valor("Correo") || SITE.email}</p>
            <p className="text-[11px] text-slate-500">
              NIT: {valor("NIT") || "—"}
              {valor("Nombre de la MIPYME") ? ` · ${valor("Nombre de la MIPYME")}` : ` · ${SITE.razonSocial}`}
            </p>
            {representante && <p className="text-[11px] text-slate-500">{t("adm.pedidos.representative")}: {representante}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold uppercase tracking-wide text-navy">{datos?.title || t("order.invoiceHeading")}</p>
            <p className="font-mono text-sm font-bold">{t("ord.number")} #{o.number}</p>
            <p className="text-[11px] text-slate-500">{fechaHora(o.createdAt)}</p>
            <p className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {tr(`ord.st.${o.status}`, o.status)}
            </p>
            <p className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${o.paid ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#fef3c7] text-[#92400e]"}`}>
              {o.paid ? t("ord.st.PAID") : t("ord.st.PENDING_PAYMENT")}
            </p>
          </div>
        </div>

        {/* Cliente / pago */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-slate-200 p-2.5">
            <Titulo>{t("order.customer")}</Titulo>
            <dl className="mt-1 space-y-0.5">
              <Dato label={t("adm.pedidos.name")} value={o.customerName} />
              <Dato label={t("cuenta.email")} value={o.customerEmail} />
              <Dato label={t("dir.phone")} value={o.customerPhone} />
              <Dato label={t("adm.pedidos.customerId")} value={o.customerId ? <span className="font-mono text-[10px]">{o.customerId}</span> : null} />
            </dl>
          </div>
          <div className="rounded border border-slate-200 p-2.5">
            <Titulo>{t("order.payment")}</Titulo>
            <dl className="mt-1 space-y-0.5">
              <Dato label={t("adm.pedidos.method")} value={pagoTexto(o.paymentMethodName ?? o.paymentMethod, lang)} />
              <Dato label={t("adm.pedidos.status")} value={o.paid ? t("ord.st.PAID") : t("ord.st.PENDING_PAYMENT")} />
              <Dato label={t("adm.pedidos.paidAt")} value={o.paidAt ? fechaHora(o.paidAt) : null} />
              <Dato label={t("adm.pedidos.paymentRef")} value={o.paymentRef ? <span className="font-mono text-[10px]">{o.paymentRef}</span> : null} />
              <Dato label={t("adm.pedidos.providerRef")} value={o.providerRef ? <span className="font-mono text-[10px]">{o.providerRef}</span> : null} />
              <Dato label={t("adm.pedidos.coupon")} value={o.couponCode} />
              {cuentaCup && <Dato label={t("adm.pedidos.cupAccount")} value={<span className="font-mono text-[10px]">{cuentaCup}</span>} />}
              {cuentaUsd && <Dato label={t("adm.pedidos.usdAccount")} value={<span className="font-mono text-[10px]">{cuentaUsd}</span>} />}
            </dl>
          </div>
        </div>

        {/* Artículos */}
        <table className="mt-3 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-50 text-left">
              <th className="py-1 pl-1 pr-2">{t("order.product")}</th>
              <th className="w-16 py-1 pr-2">Ref.</th>
              <th className="w-12 py-1 text-center">{t("order.qtyShort")}</th>
              <th className="w-24 py-1 text-right">{t("adm.pedidos.unitPrice")}</th>
              <th className="w-24 py-1 pr-1 text-right">{t("order.amount")}</th>
            </tr>
          </thead>
          <tbody>
            {o.items.map((i) => (
              <tr key={i.id} className="border-b border-slate-100 align-top">
                <td className="py-1 pl-1 pr-2">
                  {i.name}
                  {i.product?.sku && <span className="block text-[9px] text-slate-400">SKU {i.product.sku}</span>}
                </td>
                <td className="py-1 pr-2 font-mono text-[9px] text-slate-500">
                  #{i.productId}
                  {i.variantId ? <span className="block">var. {i.variantId}</span> : null}
                </td>
                <td className="py-1 text-center">{i.qty}</td>
                <td className="py-1 text-right">{money(i.unitUsd)}</td>
                <td className="py-1 pr-1 text-right font-semibold">{money(Number(i.unitUsd) * i.qty)}</td>
              </tr>
            ))}
          </tbody>
          <tfoot>
            <tr className="border-t border-slate-300 text-[10px] text-slate-500">
              <td className="py-1 pl-1" colSpan={2}>{t(o.items.length === 1 ? "adm.pedidos.lineOne" : "adm.pedidos.linePlural").replace("{n}", String(o.items.length))}</td>
              <td className="py-1 text-center font-semibold">{totalPiezas}</td>
              <td className="py-1 text-right">{t("adm.pedidos.sum")}</td>
              <td className="py-1 pr-1 text-right font-semibold">{money(lineas)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          {/* Entrega */}
          <div className="min-w-0 flex-1 rounded border border-slate-200 p-2.5">
            <Titulo>{t("order.delivery")}</Titulo>
            {d ? (
              <dl className="mt-1 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
                <Dato label={t("adm.pedidos.method")} value={d.methodName} />
                <Dato label={t("adm.pedidos.kind")} value={tr(TIPO_ENTREGA[d.kind], d.kind)} />
                <Dato label={t("dir.province")} value={provincia ? `${provincia.name}${provincia.code ? ` (${provincia.code})` : ""}` : `#${d.provinceId}`} />
                <Dato label={t("dir.municipality")} value={municipio?.name ?? `#${d.municipalityId}`} />
                <Dato label={t("dir.address")} value={d.address} />
                <Dato label={t("adm.pedidos.reference")} value={d.reference} />
                <Dato label={t("adm.pedidos.recipient")} value={d.recipientName} />
                <Dato label={t("dir.phone")} value={d.recipientPhone} />
                <Dato label={t("adm.pedidos.ci")} value={d.recipientCi} />
                <Dato label={t("adm.pedidos.gift")} value={d.isGift ? t("adm.pedidos.yes") : "No"} />
                <Dato label={t("adm.pedidos.scheduledDate")} value={d.scheduledDate ? fecha(d.scheduledDate) : null} />
                <Dato label={t("adm.pedidos.slot")} value={franja?.label} />
                <Dato label={t("adm.pedidos.pickupPoint")} value={punto ? `${punto.name}${punto.address ? ` · ${punto.address}` : ""}` : null} />
                <Dato label={t("adm.pedidos.pickupHours")} value={punto?.hours} />
                <Dato label={t("adm.pedidos.pickupPhone")} value={punto?.phone} />
                <Dato label={t("adm.pedidos.deliveryFee")} value={envioEntrega === null ? null : money(envioEntrega)} />
                <Dato label={t("order.deliveryPin")} value={<span className="font-mono text-sm font-bold tracking-widest text-navy">{d.confirmationCode}</span>} />
                <Dato label={t("adm.pedidos.status")} value={tr(ESTADO_ENTREGA[d.status], d.status)} />
                <Dato label={t("adm.pedidos.deliveredAt")} value={d.deliveredAt ? fechaHora(d.deliveredAt) : null} />
              </dl>
            ) : (
              <p className="mt-1 text-slate-500">{t("adm.pedidos.noDelivery")}</p>
            )}
          </div>

          {/* Totales */}
          <div className="w-full space-y-0.5 text-[11px] sm:w-64">
            <p className="flex justify-between"><span>{t("order.subtotal")}</span><span>{money(o.subtotalUsd)}</span></p>
            {hayDescuento && (
              <p className="flex justify-between text-[#047857]">
                <span>{t("order.discount")}{o.couponCode ? ` (${o.couponCode})` : ""}</span>
                <span>−{money(o.discountUsd)}</span>
              </p>
            )}
            <p className="flex justify-between"><span>{t("order.shipping")}</span><span>{money(o.shippingUsd)}</span></p>
            {hayComision && <p className="flex justify-between"><span>{t("adm.pedidos.paymentFee")}</span><span>{money(o.paymentFeeUsd)}</span></p>}
            <p className="flex justify-between border-t border-slate-300 pt-1 text-sm font-extrabold text-navy"><span>{t("order.total")}</span><span>{money(o.totalUsd)}</span></p>
            <p className="pt-1 text-[10px] text-slate-400">
              {o.paid ? t("adm.pedidos.collected") : t("adm.pedidos.toCollect")}
            </p>
          </div>
        </div>

        {/* Firmas */}
        <div className="mt-8 grid grid-cols-2 gap-10 text-[10px]">
          <div className="border-t border-slate-400 pt-1">
            <p className="font-semibold text-slate-700">{t("order.issuedBy")}</p>
            <p>{emitidoPor}</p>
            <p className="mt-6 text-slate-400">{t("order.signatureStamp")}</p>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p className="font-semibold text-slate-700">{t("order.receivedBy")}</p>
            <p>{recibidoPor}</p>
            <p className="mt-6 text-slate-400">{t("order.clientSignature")}</p>
          </div>
        </div>

        {/* Pie */}
        <div className="mt-5 border-t border-slate-200 pt-2 text-[9px] leading-relaxed text-slate-400">
          <p>
            {t("adm.pedidos.footerBefore")} <b className="text-slate-500">{t("adm.pedidos.footerWord")}</b> {t("adm.pedidos.footerAfter")}
            {datos?.subtitle ? ` ${datos.subtitle}` : ` ${t("adm.pedidos.footerConfirm")}`}
          </p>
          <p className="mt-1">{t("ord.number")} #{o.number} · {t("adm.pedidos.generatedAt")} {fechaHora(new Date())} · {SITE.nombre}</p>
        </div>
      </div>
    </div>
  );
}
