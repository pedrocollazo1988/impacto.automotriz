import { prisma } from "@/lib/prisma";
import { PageHeader, Panel, EmptyState } from "@/components/admin/ui";
export const dynamic = "force-dynamic";
export default async function Auditoria() {
  const logs = await prisma.auditLog.findMany({ orderBy: { id: "desc" }, take: 200 });
  return (
    <>
      <PageHeader title="Registro de actividad" subtitle="Últimos 200 movimientos del equipo" />
      <Panel>
        {!logs.length ? <EmptyState icon="clock" title="Sin actividad registrada" hint="Aquí verás los cambios que haga el equipo." /> : (
          <div className="adm-scroll">
            <table className="adm-table"><thead><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
              <tbody>{logs.map((l) => <tr key={l.id}><td className="whitespace-nowrap text-slate-500">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td><td className="font-medium">{l.staffName}</td><td><span className="font-mono text-xs text-slate-600">{l.action}</span></td><td className="text-slate-500">{l.detail}</td></tr>)}</tbody></table>
          </div>
        )}
      </Panel>
    </>);
}
