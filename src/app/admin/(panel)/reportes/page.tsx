import { prisma } from "@/lib/prisma";
import { PageHeader, PanelPad } from "@/components/admin/ui";
export const dynamic = "force-dynamic";

const Bar = ({ label, value, max, text }: { label: string; value: number; max: number; text: string }) => (
  <div className="flex items-center gap-2 text-sm"><span className="w-40 shrink-0 truncate sm:w-48">{label}</span><div className="h-4 flex-1 overflow-hidden rounded-full bg-slate-100"><div className="h-full rounded-full bg-gradient-to-r from-[color:var(--color-accent)] to-[color:var(--color-navy)]" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div><span className="w-24 shrink-0 text-right font-medium">{text}</span></div>);

export default async function Reportes() {
  const since = new Date(Date.now() - 30 * 864e5);
  const [paid, byStatus, top, viewed, byProv] = await Promise.all([
    prisma.order.findMany({ where: { paid: true, createdAt: { gte: since } }, select: { totalUsd: true, createdAt: true } }),
    prisma.order.groupBy({ by: ["status"], _count: { _all: true } }),
    prisma.orderItem.groupBy({ by: ["productId", "name"], _sum: { qty: true }, where: { order: { status: { not: "CANCELED" } } }, orderBy: { _sum: { qty: "desc" } }, take: 10 }),
    prisma.product.findMany({ orderBy: { views: "desc" }, take: 10, select: { id: true, name: true, views: true } }),
    prisma.orderDelivery.groupBy({ by: ["provinceId"], _count: { _all: true }, where: { order: { status: { not: "CANCELED" } } }, orderBy: { _count: { provinceId: "desc" } } }),
  ]);
  const provs = await prisma.province.findMany({ where: { id: { in: byProv.map((b) => b.provinceId) } } });
  const revenue = paid.reduce((s, o) => s + Number(o.totalUsd), 0);
  const perDay = new Map<string, number>(); for (const o of paid) { const d = o.createdAt.toISOString().slice(0, 10); perDay.set(d, (perDay.get(d) ?? 0) + Number(o.totalUsd)); }
  const days = [...perDay.entries()].sort(); const maxDay = Math.max(0, ...days.map(([, v]) => v));
  return (
    <>
      <PageHeader title="Reportes" subtitle="Últimos 30 días" />
      <div className="grid gap-4 sm:grid-cols-3">
        <div className="adm-panel adm-panel-pad"><p className="text-sm text-slate-500">Ventas cobradas</p><p className="mt-1 font-display text-2xl font-extrabold text-navy">{revenue.toFixed(2)} USD</p></div>
        <div className="adm-panel adm-panel-pad"><p className="text-sm text-slate-500">Pedidos pagados</p><p className="mt-1 font-display text-2xl font-extrabold text-navy">{paid.length}</p></div>
        <div className="adm-panel adm-panel-pad"><p className="text-sm text-slate-500">Ticket medio</p><p className="mt-1 font-display text-2xl font-extrabold text-navy">{paid.length ? (revenue / paid.length).toFixed(2) : "0.00"} USD</p></div>
      </div>
      <PanelPad className="mt-4"><h2 className="mb-3 font-semibold text-navy">Ventas por día</h2><div className="space-y-2">{days.map(([d, v]) => <Bar key={d} label={d} value={v} max={maxDay} text={`${v.toFixed(2)}`} />)}{!days.length && <p className="text-sm text-slate-500">Sin ventas cobradas en el período.</p>}</div></PanelPad>
      <div className="mt-4 grid gap-4 md:grid-cols-2">
        <PanelPad><h2 className="mb-3 font-semibold text-navy">Más vendidos</h2><div className="space-y-2">{top.map((t) => <Bar key={t.productId} label={t.name} value={t._sum.qty ?? 0} max={top[0]?._sum.qty ?? 0} text={`${t._sum.qty} uds`} />)}{!top.length && <p className="text-sm text-slate-500">Sin datos.</p>}</div></PanelPad>
        <PanelPad><h2 className="mb-3 font-semibold text-navy">Más vistos</h2><div className="space-y-2">{viewed.map((v) => <Bar key={v.id} label={v.name} value={v.views} max={viewed[0]?.views ?? 0} text={`${v.views}`} />)}{!viewed.length && <p className="text-sm text-slate-500">Sin datos.</p>}</div></PanelPad>
        <PanelPad><h2 className="mb-3 font-semibold text-navy">Pedidos por provincia</h2><div className="space-y-2">{byProv.map((b) => <Bar key={b.provinceId} label={provs.find((p) => p.id === b.provinceId)?.name ?? "—"} value={b._count._all} max={byProv[0]?._count._all ?? 0} text={`${b._count._all}`} />)}{!byProv.length && <p className="text-sm text-slate-500">Sin datos.</p>}</div></PanelPad>
        <PanelPad><h2 className="mb-3 font-semibold text-navy">Pedidos por estado</h2><div className="space-y-1">{byStatus.map((s) => <p key={s.status} className="flex justify-between border-b border-slate-100 pb-1 text-sm last:border-0"><span className="text-slate-500">{s.status}</span><b className="text-navy">{s._count._all}</b></p>)}{!byStatus.length && <p className="text-sm text-slate-500">Sin datos.</p>}</div></PanelPad>
      </div>
    </>);
}
