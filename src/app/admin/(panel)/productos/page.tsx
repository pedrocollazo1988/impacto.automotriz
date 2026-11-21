import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/brand/Icon";
import { PageHeader, Panel, EmptyState, Badge } from "@/components/admin/ui";
export const dynamic = "force-dynamic";

export default async function Productos() {
  const ps = await prisma.product.findMany({ where: { active: true }, orderBy: { stock: "asc" }, include: { category: true } });
  return (
    <>
      <PageHeader title="Productos e inventario" subtitle={`${ps.length} producto${ps.length === 1 ? "" : "s"} activo${ps.length === 1 ? "" : "s"}`}
        actions={<>
          <Link className="btn btn-ghost btn-sm" href="/admin/productos/importar"><Icon name="layers" size={15} /> Carga masiva (CSV)</Link>
          <Link className="btn btn-primary btn-sm" href="/admin/productos/nuevo"><Icon name="plus" size={15} /> Nuevo producto</Link>
        </>} />
      <Panel>
        {!ps.length ? (
          <EmptyState icon="cube" title="Aún no hay productos" hint="Crea uno con «Nuevo producto» o súbelos en lote desde un CSV." />
        ) : (
          <div className="adm-scroll">
            <table className="adm-table"><thead><tr><th>Código</th><th>Producto</th><th>Categoría</th><th>Precio</th><th>Existencias</th><th /></tr></thead>
              <tbody>{ps.map((p) => <tr key={p.id}><td className="font-mono text-xs">{p.sku}</td><td className="font-medium">{p.name}</td><td className="text-slate-500">{p.category.name}</td><td>{Number(p.priceUsd).toFixed(2)}</td>
                <td>{p.stock <= p.lowStockAt ? <Badge tone="danger">{p.stock} · bajas</Badge> : <span>{p.stock}</span>}</td>
                <td className="text-right"><Link className="btn btn-quiet btn-xs" href={`/admin/productos/${p.id}`}>Editar</Link></td></tr>)}</tbody></table>
          </div>
        )}
      </Panel>
    </>);
}
