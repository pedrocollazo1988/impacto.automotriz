import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  const { ids } = z.object({ ids: z.array(z.number().int()).min(1).max(4) }).parse(await req.json());
  const ps = await prisma.product.findMany({ where: { id: { in: ids }, active: true }, include: { brand: true, category: true, fits: true } });
  return Response.json(ps.map((p) => ({ id: p.id, slug: p.slug, name: p.name, image: p.images[0] ?? null, priceUsd: Number(p.priceUsd), inStock: p.stock > 0, brand: p.brand?.name ?? null, category: p.category.name,
    specs: (p.specs ?? {}) as Record<string, string>, fits: p.fits.map((f) => `${f.make} ${f.model} ${f.yearFrom}–${f.yearTo}`) })));
});
