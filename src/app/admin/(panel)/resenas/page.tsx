import { prisma } from "@/lib/prisma";
import ReviewToggle from "./ReviewToggle";
import { PageHeader, EmptyState, Badge } from "@/components/admin/ui";
import { getT } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export default async function Resenas() {
  const { t } = await getT();
  const rs = await prisma.review.findMany({ orderBy: { id: "desc" }, take: 100, include: { product: { select: { name: true } }, customer: { select: { name: true } } } });
  return (
    <>
      <PageHeader title={t("adm.resenas.title")} subtitle={t(rs.length === 1 ? "adm.resenas.subtitleOne" : "adm.resenas.subtitleMany").replace("{n}", String(rs.length))} />
      {!rs.length ? <EmptyState icon="star" title={t("adm.resenas.emptyTitle")} hint={t("adm.resenas.emptyHint")} /> : (
        <div className="space-y-3">{rs.map((r) => (
          <div key={r.id} className={`adm-panel adm-panel-pad text-sm ${r.visible ? "" : "opacity-60"}`}>
            <div className="flex items-center justify-between gap-2">
              <span className="font-semibold text-navy">{r.product.name}</span>
              <span className="flex items-center gap-2">{!r.visible && <Badge tone="mute">{t("adm.resenas.hidden")}</Badge>}<ReviewToggle id={r.id} visible={r.visible} /></span>
            </div>
            <p className="mt-1 text-slate-500">{r.customer.name} · <span className="text-amber-700">{"★".repeat(r.rating)}</span><span className="text-slate-300">{"★".repeat(5 - r.rating)}</span></p>
            <p className="mt-0.5">{r.comment}</p>
          </div>))}
        </div>
      )}
    </>);
}
