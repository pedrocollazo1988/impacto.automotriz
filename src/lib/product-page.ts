import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";

// La ficha se pide en cada visita y hace varias consultas. El producto, sus
// reseñas y los relacionados cambian poco; se cachean aparte de la sesión del
// cliente (que sí es dinámica) para no repetir esos viajes a la base de datos.
export const TAG_PRODUCTO = "producto";
export const TAG_RESENAS = "resenas";

export const getProductPageCached = unstable_cache(
  async (slug: string) => prisma.product.findFirst({
    where: { slug, active: true },
    include: {
      brand: true, category: true, fits: true,
      variants: { where: { active: true }, orderBy: { id: "asc" } },
      system: true,
      compatWith: { include: { target: { select: { slug: true, name: true, sku: true } } } },
      pins: {
        take: 3,
        include: { diagram: { include: { vehicle: { select: { slug: true, brand: true, model: true, version: true } }, system: { select: { slug: true, name: true } } } } },
      },
    },
  }),
  ["producto-ficha"],
  { revalidate: 30, tags: [TAG_PRODUCTO] },
);

export const getProductReviewsCached = unstable_cache(
  async (productId: number) => prisma.review.findMany({
    where: { productId, visible: true },
    orderBy: { id: "desc" },
    take: 20,
    include: { customer: { select: { name: true } } },
  }),
  ["producto-resenas"],
  { revalidate: 60, tags: [TAG_RESENAS] },
);

export const getRelatedProductsCached = unstable_cache(
  async (categoryId: number, excludeId: number) => prisma.product.findMany({
    where: { active: true, categoryId, id: { not: excludeId } },
    take: 4,
    include: { brand: true, category: { select: { slug: true } } },
  }),
  ["productos-relacionados"],
  { revalidate: 60, tags: [TAG_PRODUCTO] },
);
