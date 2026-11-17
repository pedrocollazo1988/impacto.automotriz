import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";
export const dynamic = "force-dynamic";
export default async function Editar({ params }: { params: Promise<{ id: string }> }) {
  const p = await prisma.product.findUnique({ where: { id: Number((await params).id) }, include: { fits: true, category: true, brand: true, variants: { where: { active: true } } } });
  if (!p) notFound();
  const [c, b] = await Promise.all([prisma.category.findMany(), prisma.brand.findMany()]);
  return (
    <main className="mx-auto max-w-4xl p-6"><h1 className="mb-4 text-2xl font-bold text-navy">Editar producto</h1>
      <ProductForm categories={c.map((x) => x.name)} brands={b.map((x) => x.name)} initial={{
        id: p.id, sku: p.sku, name: p.name, description: p.description, priceUsd: Number(p.priceUsd), compareAtUsd: p.compareAtUsd ? Number(p.compareAtUsd) : null, stock: p.stock, lowStockAt: p.lowStockAt,
        variants: p.variants.map((v) => ({ sku: v.sku, name: v.name, priceUsd: v.priceUsd != null ? Number(v.priceUsd) : null, stock: v.stock })),
        images: p.images, model3dUrl: p.model3dUrl, specs: (p.specs ?? null) as Record<string, string> | null, featured: p.featured, active: p.active, categoryName: p.category.name, brandName: p.brand?.name ?? "",
        fits: p.fits.map(({ make, model, yearFrom, yearTo }) => ({ make, model, yearFrom, yearTo })) }} /></main>);
}
