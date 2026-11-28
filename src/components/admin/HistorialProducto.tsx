import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { getT } from "@/lib/i18n";

export type MovimientoProducto = {
  id: number;
  kind: string;
  delta: number;
  stockBefore: number;
  stockAfter: number;
  detail: string;
  orderId: string | null;
  orderNumber: number | null;
  actor: string;
  source: string;
  createdAt: Date;
};

const CLAVE_MOVIMIENTO: Record<string, string> = {
  ALTA: "adm.prod.movAlta",
  EDICION: "adm.prod.movEdicion",
  AJUSTE: "adm.prod.movAjuste",
  VENTA: "adm.prod.movVenta",
  DEVOLUCION: "adm.prod.movDevolucion",
  CANCELACION: "adm.prod.movCancelacion",
  BAJA: "adm.prod.movBaja",
};

const COLOR: Record<string, string> = {
  ALTA: "bg-emerald-50 text-emerald-700",
  EDICION: "bg-slate-100 text-slate-700",
  AJUSTE: "bg-amber-50 text-amber-700",
  VENTA: "bg-blue-50 text-blue-700",
  DEVOLUCION: "bg-violet-50 text-violet-700",
  CANCELACION: "bg-red-50 text-red-700",
  BAJA: "bg-red-50 text-red-700",
};

const fecha = (d: Date) =>
  new Intl.DateTimeFormat("es-CU", {
    timeZone: "America/Havana",
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);

export default async function HistorialProducto({ movimientos, stock, creadoEn }: { movimientos: MovimientoProducto[]; stock: number; creadoEn?: Date }) {
  const { t } = await getT();
  return (
    <section className="rounded-xl border border-slate-200 bg-white">
      <header className="flex flex-wrap items-center justify-between gap-3 border-b border-slate-100 px-4 py-3">
        <div>
          <h2 className="flex items-center gap-2 text-sm font-semibold text-navy"><Icon name="box" size={16} /> {t("adm.prod.historyTitle")}</h2>
          <p className="mt-0.5 text-xs text-slate-500">{t("adm.prod.historySubtitle")} <b className="text-navy">{stock}</b>{creadoEn ? ` · ${t("adm.prod.historyCreatedAt").replace("{date}", fecha(creadoEn))}` : ""}</p>
        </div>
        <span className="text-xs text-slate-400">{t("adm.prod.historyCount").replace("{n}", String(movimientos.length))}</span>
      </header>
      {movimientos.length === 0 ? (
        <p className="px-4 py-8 text-center text-sm text-slate-500">{creadoEn ? t("adm.prod.historyEmptySince").replace("{date}", fecha(creadoEn)) : t("adm.prod.historyEmpty")}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full min-w-[720px] text-left text-sm">
            <thead className="bg-slate-50 text-[11px] uppercase tracking-wide text-slate-500">
              <tr>
                <th className="px-4 py-2 font-semibold">{t("adm.prod.colDate")}</th>
                <th className="px-4 py-2 font-semibold">{t("adm.prod.colMovement")}</th>
                <th className="px-4 py-2 font-semibold">{t("adm.prod.colDetail")}</th>
                <th className="px-4 py-2 font-semibold">{t("adm.prod.colOrder")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("adm.prod.colChange")}</th>
                <th className="px-4 py-2 text-right font-semibold">{t("adm.prod.colFinalStock")}</th>
                <th className="px-4 py-2 font-semibold">{t("adm.prod.colUser")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {movimientos.map((m) => (
                <tr key={m.id} className="align-top hover:bg-slate-50/60">
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{fecha(m.createdAt)}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-flex rounded-full px-2 py-0.5 text-[11px] font-semibold ${COLOR[m.kind] ?? "bg-slate-100 text-slate-700"}`}>
                      {t(CLAVE_MOVIMIENTO[m.kind] ?? m.kind)}
                    </span>
                  </td>
                  <td className="max-w-[280px] px-4 py-3 text-xs text-slate-600">{m.detail || "—"}</td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs">
                    {m.orderId && m.orderNumber ? (
                      <Link href={`/admin/pedidos/${m.orderId}/prefactura`} className="font-semibold text-[color:var(--color-action)] hover:underline">
                        {t("adm.prod.historyOrderLink").replace("{n}", String(m.orderNumber))}
                      </Link>
                    ) : "—"}
                  </td>
                  <td className={`whitespace-nowrap px-4 py-3 text-right font-semibold ${m.delta > 0 ? "text-emerald-700" : m.delta < 0 ? "text-red-600" : "text-slate-400"}`}>
                    {m.delta > 0 ? `+${m.delta}` : m.delta}
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-right">
                    <span className="font-semibold text-navy">{m.stockAfter}</span>
                    <span className="ml-1 text-[11px] text-slate-400">({m.stockBefore} → {m.stockAfter})</span>
                  </td>
                  <td className="whitespace-nowrap px-4 py-3 text-xs text-slate-500">{m.actor || m.source}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}
