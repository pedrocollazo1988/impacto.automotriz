import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/brand/Icon";
import { PageHeader, Panel, EmptyState } from "@/components/admin/ui";
import TablaProductos from "./TablaProductos";
import { puedeEliminarProducto, requirePage } from "@/lib/auth";
export const dynamic = "force-dynamic";

export default async function Productos() {
  const u = await requirePage("products");
  const ps = await prisma.product.findMany({ where: { active: true }, orderBy: { stock: "asc" }, include: { category: true } });
  const filas = ps.map((p) => ({
    id: p.id,
    sku: p.sku,
    name: p.name,
    category: p.category.name,
    priceUsd: Number(p.priceUsd),
    stock: p.stock,
    lowStockAt: p.lowStockAt,
  }));
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
          <TablaProductos filas={filas} puedeEliminar={puedeEliminarProducto(u)} />
        )}
      </Panel>
    </>);
}
