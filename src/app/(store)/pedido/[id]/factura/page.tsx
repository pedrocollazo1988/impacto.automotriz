import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { canViewOrder } from "@/lib/order-access";
import { leerSeccion } from "@/lib/contenido-server";
import { pagoTexto } from "@/lib/pagos-i18n";
import { getT } from "@/lib/i18n";
import PrintButton from "@/components/PrintButton";
import Logo from "@/components/brand/Logo";
export const dynamic = "force-dynamic";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("order.invoiceMeta"), robots: { index: false } };
}

const fecha = (d: Date) => d.toLocaleDateString("es-CU", { day: "2-digit", month: "2-digit", year: "numeric" });
const hora = (d: Date) => d.toLocaleTimeString("es-CU", { hour: "2-digit", minute: "2-digit" });

// Prefactura imprimible en una hoja A4. El navegador la convierte en PDF con
// «Imprimir → Guardar como PDF»; no se genera un PDF en servidor para no
// arrastrar una dependencia pesada ni exponer los datos del pedido.
export default async function Factura({ params, searchParams }: { params: Promise<{ id: string }>; searchParams: Promise<{ t?: string }> }) {
  const [o, datos] = await Promise.all([
    prisma.order.findUnique({ where: { id: (await params).id }, include: { items: true, delivery: true } }),
    leerSeccion("facturacion").catch(() => null),
  ]);
  if (!o || !(await canViewOrder(o, (await searchParams).t))) notFound();
  const { t, lang } = await getT();
  const m = (n: unknown) => `${Number(n).toFixed(2)} USD`;
  const filas = (datos?.items ?? []).filter((i) => i.titulo);
  const valor = (nombre: string) => filas.find((i) => i.titulo?.toLowerCase().includes(nombre.toLowerCase()))?.texto ?? "";
  const emitidoPor = valor("Emitido por") || "Impacto Automotriz";
  const recibidoPor = valor("Recibido por") || o.customerName;
  const pin = o.delivery?.confirmationCode;

  return (
    <div className="factura mx-auto max-w-3xl bg-white p-6 text-[12px] leading-snug text-slate-700 print:max-w-none print:p-0">
      <div className="flex items-start justify-between gap-6 border-b-2 border-navy pb-3">
        <div>
          <Logo href={null} size="md" tagline={false} className="mb-1" />
          <p className="text-[11px] text-slate-500">{valor("Domicilio social")}</p>
          <p className="text-[11px] text-slate-500">{valor("Teléfonos")} · {valor("Correo")}</p>
          <p className="text-[11px] text-slate-500">NIT: {valor("NIT") || "—"}</p>
        </div>
        <div className="text-right">
          <p className="font-display text-2xl font-extrabold uppercase tracking-wide text-navy">{datos?.title || t("order.invoiceHeading")}</p>
          <p className="font-mono text-sm font-bold">#{o.number}</p>
          <p className="text-[11px] text-slate-500">{fecha(o.createdAt)} · {hora(o.createdAt)}</p>
          <p className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">{o.paid ? t("ord.st.PAID") : t("ord.st.PENDING_PAYMENT")}</p>
        </div>
      </div>

      <div className="mt-3 grid gap-3 sm:grid-cols-2">
        <div className="rounded border border-slate-200 p-2.5">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">{t("order.customer")}</p>
          <p className="mt-1 font-semibold text-slate-800">{o.customerName}</p>
          <p>{o.customerEmail}</p>
          <p>{o.customerPhone}</p>
          {o.delivery && <p className="mt-1">{t("order.delivery")}: {o.delivery.methodName}{o.delivery.address ? ` · ${o.delivery.address}` : ""}</p>}
        </div>
        <div className="rounded border border-slate-200 p-2.5">
          <p className="font-mono text-[9px] font-bold uppercase tracking-wider text-slate-400">{t("order.smeData")}</p>
          <dl className="mt-1 grid grid-cols-[auto_1fr] gap-x-2 gap-y-0.5">
            {filas.filter((f) => !/^(emitido|recibido) por$/i.test(f.titulo ?? "")).map((f) => (
              <div key={f.titulo} className="contents">
                <dt className="font-semibold text-slate-500">{f.titulo}:</dt>
                <dd className="break-words">{f.texto || "—"}</dd>
              </div>
            ))}
          </dl>
        </div>
      </div>

      <table className="mt-3 w-full border-collapse text-[11px]">
        <thead>
          <tr className="border-y border-slate-300 bg-slate-50 text-left">
            <th className="py-1 pr-2">{t("order.product")}</th>
            <th className="w-12 py-1 text-center">{t("order.qtyShort")}</th>
            <th className="w-24 py-1 text-right">{t("order.price")}</th>
            <th className="w-24 py-1 text-right">{t("order.amount")}</th>
          </tr>
        </thead>
        <tbody>
          {o.items.map((i) => (
            <tr key={i.id} className="border-b border-slate-100 align-top">
              <td className="py-1 pr-2">{i.name}</td>
              <td className="py-1 text-center">{i.qty}</td>
              <td className="py-1 text-right">{m(i.unitUsd)}</td>
              <td className="py-1 text-right">{m(Number(i.unitUsd) * i.qty)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
        <div className="max-w-[55%] text-[10px] text-slate-500">
          {o.delivery && <p>{t("order.receives")} <b className="text-slate-700">{o.delivery.recipientName}</b> · {o.delivery.recipientPhone}{o.delivery.recipientCi ? ` · CI ${o.delivery.recipientCi}` : ""}</p>}
          {pin && <p className="mt-1">{t("order.deliveryPin")}: <b className="font-mono text-sm tracking-widest text-navy">{pin}</b></p>}
          <p className="mt-1">{t("order.payment")}: {pagoTexto(o.paymentMethodName ?? o.paymentMethod, lang)}</p>
          {datos?.subtitle && <p className="mt-2">{datos.subtitle}</p>}
        </div>
        <div className="w-56 space-y-0.5 text-[11px]">
          <p className="flex justify-between"><span>{t("order.subtotal")}</span>{m(o.subtotalUsd)}</p>
          {Number(o.discountUsd) > 0 && <p className="flex justify-between"><span>{t("order.discount")} {o.couponCode}</span>−{m(o.discountUsd)}</p>}
          <p className="flex justify-between"><span>{t("order.shipping")}</span>{m(o.shippingUsd)}</p>
          <p className="flex justify-between border-t border-slate-300 pt-1 text-sm font-extrabold text-navy"><span>{t("order.total")}</span>{m(o.totalUsd)}</p>
        </div>
      </div>

      <div className="mt-8 grid grid-cols-2 gap-10 text-[10px]">
        <div className="border-t border-slate-400 pt-1"><p className="font-semibold text-slate-700">{t("order.issuedBy")}</p><p>{emitidoPor}</p><p className="mt-6 text-slate-400">{t("order.signatureStamp")}</p></div>
        <div className="border-t border-slate-400 pt-1"><p className="font-semibold text-slate-700">{t("order.receivedBy")}</p><p>{recibidoPor}</p><p className="mt-6 text-slate-400">{t("order.clientSignature")}</p></div>
      </div>

      <div className="mt-5 flex justify-end print:hidden"><PrintButton /></div>
    </div>
  );
}
