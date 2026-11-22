import type { MetadataRoute } from "next";
import { prisma } from "@/lib/prisma";

const site = process.env.PUBLIC_URL ?? "http://localhost:3000";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes = [
    "", "/catalogo", "/ofertas", "/nosotros", "/contacto", "/preguntas-frecuentes",
    "/marcas-y-modelos", "/renta", "/servicios", "/novedades", "/testimonios",
    "/politicas/envios", "/politicas/devoluciones", "/politicas/privacidad", "/politicas/terminos",
  ].map((p) => ({ url: `${site}${p}`, changeFrequency: "weekly" as const, priority: p === "" ? 1 : 0.7 }));

  try {
    const [products, categories] = await Promise.all([
      prisma.product.findMany({ where: { active: true }, select: { slug: true, createdAt: true } }),
      prisma.category.findMany({ select: { slug: true } }),
    ]);
    return [
      ...staticRoutes,
      ...categories.map((c) => ({ url: `${site}/catalogo?categoria=${c.slug}`, changeFrequency: "weekly" as const, priority: 0.6 })),
      ...products.map((p) => ({ url: `${site}/producto/${p.slug}`, lastModified: p.createdAt, changeFrequency: "weekly" as const, priority: 0.8 })),
    ];
  } catch {
    return staticRoutes;
  }
}
