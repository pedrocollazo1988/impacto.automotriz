import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";
import { PageHeader, PanelPad } from "@/components/admin/ui";
import HistorialProducto from "@/components/admin/HistorialProducto";
import { getT } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  const { t } = await getT();
  const p = await prisma.product.findUnique({ where: { id: Number((await params).id) }, include: { fits: true, category: true, brand: true, variants: { where: { active: true } } } });
  if (!p) notFound();
  const [c, b, movimientos] = await Promise.all([
    prisma.category.findMany(),
    prisma.brand.findMany(),
    prisma.productMovement.findMany({ where: { productId: p.id }, orderBy: { createdAt: "desc" }, take: 100 }),
  ]);
  return (
    <>
      <PageHeader title={t("adm.prod.editTitle")} subtitle={p.name} />
      <PanelPad>
        <ProductForm categories={c.map((x) => x.name)} brands={b.map((x) => x.name)} blob={!!process.env.BLOB_READ_WRITE_TOKEN} initial={{
          id: p.id, sku: p.sku, name: p.name, description: p.description, nameEn: p.nameEn, descriptionEn: p.descriptionEn, priceUsd: Number(p.priceUsd), compareAtUsd: p.compareAtUsd ? Number(p.compareAtUsd) : null, stock: p.stock, lowStockAt: p.lowStockAt,
          variants: p.variants.map((v) => ({ sku: v.sku, name: v.name, priceUsd: v.priceUsd != null ? Number(v.priceUsd) : null, stock: v.stock })),
          images: p.images, videos: p.videos, model3dUrl: p.model3dUrl, model3dVideo: p.model3dVideo,
          spin360Frames: p.spin360Frames, spin360Video: p.spin360Video,
          viewerMode: p.viewerMode, specs: (p.specs ?? null) as Record<string, string> | null, specsEn: (p.specsEn ?? null) as Record<string, string> | null, featured: p.featured, active: p.active, categoryName: p.category.name, brandName: p.brand?.name ?? "",
          fits: p.fits.map(({ make, model, yearFrom, yearTo }) => ({ make, model, yearFrom, yearTo })) }} />
        <div className="mt-6">
          <HistorialProducto movimientos={movimientos} stock={p.stock} creadoEn={p.createdAt} />
        </div>
      </PanelPad>
    </>
  );
}
