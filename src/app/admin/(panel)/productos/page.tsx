import Link from "next/link";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/brand/Icon";
import { PageHeader, Panel, EmptyState } from "@/components/admin/ui";
import TablaProductos from "./TablaProductos";
import { puedeEliminarProducto, requirePage } from "@/lib/auth";
import { getT } from "@/lib/i18n";
export const dynamic = "force-dynamic";

export default async function Productos() {
  const { t } = await getT();
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
      <PageHeader title={t("adm.prod.title")} subtitle={`${ps.length} ${t(ps.length === 1 ? "adm.prod.activeOne" : "adm.prod.activeMany")}`}
        actions={<>
          <Link className="btn btn-ghost btn-sm" href="/admin/productos/importar"><Icon name="layers" size={15} /> {t("adm.prod.bulkCsv")}</Link>
          <Link className="btn btn-primary btn-sm" href="/admin/productos/nuevo"><Icon name="plus" size={15} /> {t("adm.prod.new")}</Link>
        </>} />
      <Panel>
        {!ps.length ? (
          <EmptyState icon="cube" title={t("adm.prod.emptyTitle")} hint={t("adm.prod.emptyHint")} />
        ) : (
          <TablaProductos filas={filas} puedeEliminar={puedeEliminarProducto(u)} />
        )}
      </Panel>
    </>);
}
