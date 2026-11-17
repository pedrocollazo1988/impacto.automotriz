import { prisma } from "@/lib/prisma";
import ReviewToggle from "./ReviewToggle";
export const dynamic = "force-dynamic";
export default async function Resenas() {
  const rs = await prisma.review.findMany({ orderBy: { id: "desc" }, take: 100, include: { product: { select: { name: true } }, customer: { select: { name: true } } } });
  return (
    <main className="mx-auto max-w-4xl space-y-3 p-6"><h1 className="text-2xl font-bold text-navy">Moderación de reseñas</h1>
      {rs.map((r) => <div key={r.id} className={`rounded-lg border p-3 text-sm ${r.visible ? "" : "bg-slate-50 text-slate-400"}`}><div className="flex justify-between"><b>{r.product.name}</b><ReviewToggle id={r.id} visible={r.visible} /></div><p>{r.customer.name} · <span className="text-amber-500">{"★".repeat(r.rating)}</span></p><p>{r.comment}</p></div>)}
      {!rs.length && <p className="text-sm text-slate-500">Aún no hay reseñas.</p>}</main>);
}
