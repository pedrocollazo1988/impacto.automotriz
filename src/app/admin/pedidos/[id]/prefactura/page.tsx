import type { ReactNode } from "react";
import Link from "next/link";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/auth";
import { leerSeccion } from "@/lib/contenido-server";
import { SITE } from "@/lib/site";
import PrintButton from "@/components/PrintButton";
import Logo from "@/components/brand/Logo";

export const dynamic = "force-dynamic";
export const metadata = { title: "Prefactura", robots: { index: false } };

const ESTADO_PEDIDO: Record<string, string> = {
  PENDING_PAYMENT: "Pendiente de pago",
  PAID: "Pagado",
  PREPARING: "En preparación",
  SHIPPED: "Enviado",
  DELIVERED: "Entregado",
  CANCELED: "Cancelado",
};

const ESTADO_ENTREGA: Record<string, string> = {
  PENDING: "Pendiente",
  READY: "Listo para entrega",
  OUT_FOR_DELIVERY: "En reparto",
  DELIVERED: "Entregado",
  FAILED: "Fallido",
};

const TIPO_ENTREGA: Record<string, string> = {
  HOME_DELIVERY: "A domicilio",
  STORE_PICKUP: "Recogida en tienda",
  COURIER: "Mensajería",
  AGREED_POINT: "Punto acordado",
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
            ← Volver a pedidos
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
            {representante && <p className="text-[11px] text-slate-500">Representante legal: {representante}</p>}
          </div>
          <div className="text-right">
            <p className="font-display text-2xl font-extrabold uppercase tracking-wide text-navy">{datos?.title || "PREFACTURA"}</p>
            <p className="font-mono text-sm font-bold">Pedido #{o.number}</p>
            <p className="text-[11px] text-slate-500">{fechaHora(o.createdAt)}</p>
            <p className="mt-1 inline-block rounded bg-slate-100 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider text-slate-600">
              {ESTADO_PEDIDO[o.status] ?? o.status}
            </p>
            <p className={`mt-1 inline-block rounded px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider ${o.paid ? "bg-[#d1fae5] text-[#065f46]" : "bg-[#fef3c7] text-[#92400e]"}`}>
              {o.paid ? "Pagado" : "Pendiente de pago"}
            </p>
          </div>
        </div>

        {/* Cliente / pago */}
        <div className="mt-3 grid gap-3 sm:grid-cols-2">
          <div className="rounded border border-slate-200 p-2.5">
            <Titulo>Cliente</Titulo>
            <dl className="mt-1 space-y-0.5">
              <Dato label="Nombre" value={o.customerName} />
              <Dato label="Correo" value={o.customerEmail} />
              <Dato label="Teléfono" value={o.customerPhone} />
              <Dato label="ID de cliente" value={o.customerId ? <span className="font-mono text-[10px]">{o.customerId}</span> : null} />
            </dl>
          </div>
          <div className="rounded border border-slate-200 p-2.5">
            <Titulo>Pago</Titulo>
            <dl className="mt-1 space-y-0.5">
              <Dato label="Método" value={o.paymentMethodName ?? o.paymentMethod} />
              <Dato label="Estado" value={o.paid ? "Pagado" : "Pendiente de pago"} />
              <Dato label="Pagado el" value={o.paidAt ? fechaHora(o.paidAt) : null} />
              <Dato label="Ref. de pago" value={o.paymentRef ? <span className="font-mono text-[10px]">{o.paymentRef}</span> : null} />
              <Dato label="Ref. proveedor" value={o.providerRef ? <span className="font-mono text-[10px]">{o.providerRef}</span> : null} />
              <Dato label="Cupón" value={o.couponCode} />
              {cuentaCup && <Dato label="Cuenta CUP" value={<span className="font-mono text-[10px]">{cuentaCup}</span>} />}
              {cuentaUsd && <Dato label="Cuenta USD" value={<span className="font-mono text-[10px]">{cuentaUsd}</span>} />}
            </dl>
          </div>
        </div>

        {/* Artículos */}
        <table className="mt-3 w-full border-collapse text-[11px]">
          <thead>
            <tr className="border-y border-slate-300 bg-slate-50 text-left">
              <th className="py-1 pl-1 pr-2">Producto</th>
              <th className="w-16 py-1 pr-2">Ref.</th>
              <th className="w-12 py-1 text-center">Cant.</th>
              <th className="w-24 py-1 text-right">Precio unit.</th>
              <th className="w-24 py-1 pr-1 text-right">Importe</th>
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
              <td className="py-1 pl-1" colSpan={2}>{o.items.length} línea{o.items.length === 1 ? "" : "s"}</td>
              <td className="py-1 text-center font-semibold">{totalPiezas}</td>
              <td className="py-1 text-right">Suma</td>
              <td className="py-1 pr-1 text-right font-semibold">{money(lineas)}</td>
            </tr>
          </tfoot>
        </table>

        <div className="mt-3 flex flex-wrap items-start justify-between gap-4">
          {/* Entrega */}
          <div className="min-w-0 flex-1 rounded border border-slate-200 p-2.5">
            <Titulo>Entrega</Titulo>
            {d ? (
              <dl className="mt-1 grid gap-x-4 gap-y-0.5 sm:grid-cols-2">
                <Dato label="Método" value={d.methodName} />
                <Dato label="Tipo" value={TIPO_ENTREGA[d.kind] ?? d.kind} />
                <Dato label="Provincia" value={provincia ? `${provincia.name}${provincia.code ? ` (${provincia.code})` : ""}` : `#${d.provinceId}`} />
                <Dato label="Municipio" value={municipio?.name ?? `#${d.municipalityId}`} />
                <Dato label="Dirección" value={d.address} />
                <Dato label="Referencia" value={d.reference} />
                <Dato label="Destinatario" value={d.recipientName} />
                <Dato label="Teléfono" value={d.recipientPhone} />
                <Dato label="CI" value={d.recipientCi} />
                <Dato label="Regalo" value={d.isGift ? "Sí" : "No"} />
                <Dato label="Fecha programada" value={d.scheduledDate ? fecha(d.scheduledDate) : null} />
                <Dato label="Franja" value={franja?.label} />
                <Dato label="Punto de recogida" value={punto ? `${punto.name}${punto.address ? ` · ${punto.address}` : ""}` : null} />
                <Dato label="Horario del punto" value={punto?.hours} />
                <Dato label="Teléfono del punto" value={punto?.phone} />
                <Dato label="Tarifa de entrega" value={envioEntrega === null ? null : money(envioEntrega)} />
                <Dato label="PIN de entrega" value={<span className="font-mono text-sm font-bold tracking-widest text-navy">{d.confirmationCode}</span>} />
                <Dato label="Estado" value={ESTADO_ENTREGA[d.status] ?? d.status} />
                <Dato label="Entregado el" value={d.deliveredAt ? fechaHora(d.deliveredAt) : null} />
              </dl>
            ) : (
              <p className="mt-1 text-slate-500">Este pedido no tiene datos de entrega registrados.</p>
            )}
          </div>

          {/* Totales */}
          <div className="w-full space-y-0.5 text-[11px] sm:w-64">
            <p className="flex justify-between"><span>Subtotal</span><span>{money(o.subtotalUsd)}</span></p>
            {hayDescuento && (
              <p className="flex justify-between text-[#047857]">
                <span>Descuento{o.couponCode ? ` (${o.couponCode})` : ""}</span>
                <span>−{money(o.discountUsd)}</span>
              </p>
            )}
            <p className="flex justify-between"><span>Envío</span><span>{money(o.shippingUsd)}</span></p>
            {hayComision && <p className="flex justify-between"><span>Comisión de pasarela</span><span>{money(o.paymentFeeUsd)}</span></p>}
            <p className="flex justify-between border-t border-slate-300 pt-1 text-sm font-extrabold text-navy"><span>Total</span><span>{money(o.totalUsd)}</span></p>
            <p className="pt-1 text-[10px] text-slate-400">
              {o.paid ? "Importe cobrado." : "Importe a cobrar al validar el pago."}
            </p>
          </div>
        </div>

        {/* Firmas */}
        <div className="mt-8 grid grid-cols-2 gap-10 text-[10px]">
          <div className="border-t border-slate-400 pt-1">
            <p className="font-semibold text-slate-700">Emitido por</p>
            <p>{emitidoPor}</p>
            <p className="mt-6 text-slate-400">Firma y sello</p>
          </div>
          <div className="border-t border-slate-400 pt-1">
            <p className="font-semibold text-slate-700">Recibido por</p>
            <p>{recibidoPor}</p>
            <p className="mt-6 text-slate-400">Firma del cliente</p>
          </div>
        </div>

        {/* Pie */}
        <div className="mt-5 border-t border-slate-200 pt-2 text-[9px] leading-relaxed text-slate-400">
          <p>
            Este documento es una <b className="text-slate-500">prefactura</b> de uso interno y no constituye una factura fiscal.
            {datos?.subtitle ? ` ${datos.subtitle}` : " El importe queda confirmado cuando se valida el pago."}
          </p>
          <p className="mt-1">Pedido #{o.number} · Generado el {fechaHora(new Date())} · {SITE.nombre}</p>
        </div>
      </div>
    </div>
  );
}
