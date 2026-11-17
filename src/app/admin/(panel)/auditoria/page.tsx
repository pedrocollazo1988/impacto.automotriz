import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";
export default async function Auditoria() {
  const logs = await prisma.auditLog.findMany({ orderBy: { id: "desc" }, take: 200 });
  return (
    <main className="mx-auto max-w-5xl p-6"><h1 className="mb-4 text-2xl font-bold text-navy">Registro de actividad</h1>
      <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th>Fecha</th><th>Usuario</th><th>Acción</th><th>Detalle</th></tr></thead>
        <tbody>{logs.map((l) => <tr key={l.id} className="border-t"><td className="py-1.5">{l.createdAt.toISOString().slice(0, 16).replace("T", " ")}</td><td>{l.staffName}</td><td className="font-mono text-xs">{l.action}</td><td>{l.detail}</td></tr>)}</tbody></table></main>);
}
