import Link from "next/link";
import { prisma } from "@/lib/prisma";
export const dynamic = "force-dynamic";

export default async function Productos() {
  const ps = await prisma.product.findMany({ where: { active: true }, orderBy: { stock: "asc" }, include: { category: true } });
  return (
    <main className="mx-auto max-w-6xl p-6">
      <div className="mb-4 flex items-center justify-between"><h1 className="text-2xl font-bold text-navy">Productos e inventario</h1>
        <div className="space-x-2 text-sm"><Link className="rounded bg-navy px-4 py-2 text-white" href="/admin/productos/nuevo">Nuevo producto</Link><Link className="rounded border px-4 py-2" href="/admin/productos/importar">Carga masiva (CSV)</Link></div></div>
      <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Existencias</th><th /></tr></thead>
        <tbody>{ps.map((p) => <tr key={p.id} className="border-t"><td className="py-2">{p.sku}</td><td>{p.name}</td><td>{p.category.name}</td><td>{Number(p.priceUsd).toFixed(2)}</td>
          <td className={p.stock <= p.lowStockAt ? "font-bold text-red-600" : ""}>{p.stock}{p.stock <= p.lowStockAt ? " ⚠ bajas" : ""}</td><td><Link className="text-navy underline" href={`/admin/productos/${p.id}`}>Editar</Link></td></tr>)}</tbody></table>
    </main>);
}
