import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin } from "@/lib/auth";
import { generateModel3dFromImage } from "@/lib/model3d";

const Body = z.object({ limit: z.number().int().min(1).max(200).optional(), onlyMissing: z.boolean().optional() });

// Genera modelos .glb en lote a partir de la foto principal de cada producto.
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const { limit = 50, onlyMissing = true } = Body.parse(await req.json().catch(() => ({})));

  const products = await prisma.product.findMany({
    where: { active: true, images: { isEmpty: false }, ...(onlyMissing ? { model3dUrl: null } : {}) },
    select: { id: true, name: true, sku: true, images: true },
    orderBy: { id: "desc" },
    take: limit,
  });

  let ok = 0;
  const failed: { sku: string; error: string }[] = [];
  for (const p of products) {
    try {
      const url = await generateModel3dFromImage(p.images[0], p.name);
      await prisma.product.update({ where: { id: p.id }, data: { model3dUrl: url } });
      ok++;
    } catch (e) {
      failed.push({ sku: p.sku, error: e instanceof Error ? e.message : "Error" });
    }
  }
  await audit(u, "producto.modelo3d.lote", `generados=${ok} fallidos=${failed.length}`);
  return Response.json({ total: products.length, ok, failed });
});
