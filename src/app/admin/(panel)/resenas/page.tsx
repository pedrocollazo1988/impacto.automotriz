import { prisma } from "@/lib/prisma";
import ReviewToggle from "./ReviewToggle";
import { PageHeader, EmptyState, Badge } from "@/components/admin/ui";
export const dynamic = "force-dynamic";
export default async function Resenas() {
  const rs = await prisma.review.findMany({ orderBy: { id: "desc" }, take: 100, include: { product: { select: { name: true } }, customer: { select: { name: true } } } });
  return (
    <>
      <PageHeader title="Moderación de reseñas" subtitle={`${rs.length} reseña${rs.length === 1 ? "" : "s"}`} />
      {!rs.length ? <EmptyState icon="star" title="Aún no hay reseñas" hint="Las valoraciones de los clientes aparecerán aquí para moderarlas." /> : (
        <div className="space-y-3">{rs.map((r) => (
          <div key={r.id} className={`adm-panel adm-panel-pad text-sm ${r.visible ? "" : "opacity-60"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-navy">{r.product.name}</span>
              <span className="flex items-center gap-2">{!r.visible && <Badge tone="mute">Oculta</Badge>}<ReviewToggle id={r.id} visible={r.visible} /></span>
            </div>
            <p className="mt-1 text-slate-500">{r.customer.name} · <span className="text-amber-700">{"★".repeat(r.rating)}</span><span className="text-slate-300">{"★".repeat(5 - r.rating)}</span></p>
            <p className="mt-0.5">{r.comment}</p>
          </div>))}
        </div>
      )}
    </>);
}
