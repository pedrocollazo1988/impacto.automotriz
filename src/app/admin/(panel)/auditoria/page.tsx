import { prisma } from "@/lib/prisma";
import { PageHeader, Panel, EmptyState } from "@/components/admin/ui";
import { getT } from "@/lib/i18n";
import { motivoTexto } from "@/lib/pedido-i18n";
export const dynamic = "force-dynamic";
export default async function Auditoria() {
  const { lang, t } = await getT();
  const logs = await prisma.auditLog.findMany({ orderBy: { id: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title={t("adm.actividad.title")} subtitle={t("adm.actividad.subtitle")} />
      <Panel>
        {!logs.length ? <EmptyState icon="clock" title={t("adm.actividad.emptyTitle")} hint={t("adm.actividad.emptyHint")} /> : (
          <div className="adm-scroll">
            <table className="adm-table"><thead><tr><th>{t("adm.actividad.date")}</th><th>{t("adm.actividad.user")}</th><th>{t("adm.actividad.action")}</th><th>{t("adm.actividad.detail")}</th></tr></thead>
              <tbody>{logs.map((l) => <tr key={l.id}><td className="whitespace-nowrap text-slate-500">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td><td className="font-medium">{l.staffName}</td><td><span className="font-mono text-xs text-slate-600">{l.action}</span></td><td className="text-slate-500">{l.detail ? motivoTexto(l.detail, lang) : "—"}</td></tr>)}</tbody></table>
          </div>
        )}
      </Panel>
    </>);
}
