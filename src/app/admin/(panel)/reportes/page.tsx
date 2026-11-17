import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

const Bar = ({ label, value, max, text }: { label: string; value: number; max: number; text: string }) => (
  <div className="flex items-center gap-2 text-sm"><span className="w-48 truncate">{label}</span><div className="h-4 flex-1 rounded bg-slate-100"><div className="h-4 rounded bg-navy" style={{ width: `${max ? (value / max) * 100 : 0}%` }} /></div><span className="w-24 text-right">{text}</span></div>);

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
  const card = "rounded-xl border p-4";
  return (
    <main className="mx-auto max-w-5xl space-y-6 p-6"><h1 className="text-2xl font-bold text-navy">Reportes (últimos 30 días)</h1>
      <div className="grid gap-4 sm:grid-cols-3"><div className={card}><p className="text-sm text-slate-500">Ventas cobradas</p><p className="text-2xl font-bold">{revenue.toFixed(2)} USD</p></div>
        <div className={card}><p className="text-sm text-slate-500">Pedidos pagados</p><p className="text-2xl font-bold">{paid.length}</p></div>
        <div className={card}><p className="text-sm text-slate-500">Ticket medio</p><p className="text-2xl font-bold">{paid.length ? (revenue / paid.length).toFixed(2) : "0.00"} USD</p></div></div>
      <section className={card}><h2 className="mb-2 font-semibold">Ventas por día</h2><div className="space-y-1">{days.map(([d, v]) => <Bar key={d} label={d} value={v} max={maxDay} text={`${v.toFixed(2)}`} />)}{!days.length && <p className="text-sm text-slate-500">Sin ventas cobradas en el período.</p>}</div></section>
      <div className="grid gap-4 md:grid-cols-2">
        <section className={card}><h2 className="mb-2 font-semibold">Más vendidos</h2><div className="space-y-1">{top.map((t) => <Bar key={t.productId} label={t.name} value={t._sum.qty ?? 0} max={top[0]?._sum.qty ?? 0} text={`${t._sum.qty} uds`} />)}</div></section>
        <section className={card}><h2 className="mb-2 font-semibold">Más vistos</h2><div className="space-y-1">{viewed.map((v) => <Bar key={v.id} label={v.name} value={v.views} max={viewed[0]?.views ?? 0} text={`${v.views}`} />)}</div></section>
        <section className={card}><h2 className="mb-2 font-semibold">Pedidos por provincia</h2><div className="space-y-1">{byProv.map((b) => <Bar key={b.provinceId} label={provs.find((p) => p.id === b.provinceId)?.name ?? "—"} value={b._count._all} max={byProv[0]?._count._all ?? 0} text={`${b._count._all}`} />)}</div></section>
        <section className={card}><h2 className="mb-2 font-semibold">Pedidos por estado</h2>{byStatus.map((s) => <p key={s.status} className="flex justify-between text-sm"><span>{s.status}</span><b>{s._count._all}</b></p>)}</section></div>
    </main>);
}
