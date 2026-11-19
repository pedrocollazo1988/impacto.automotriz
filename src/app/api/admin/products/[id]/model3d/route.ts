import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { generateModel3dFromImage } from "@/lib/model3d";

const Body = z.object({
  imageUrl: z.string().max(500).optional(),
  imageIndex: z.number().int().min(0).max(20).optional(),
  save: z.boolean().optional(),
});

// Genera un modelo .glb a partir de una foto del producto (por defecto, la principal).
export const POST = handle(async (req: Request, ctx: { params: Promise<{ id: string }> }) => {
  const u = await requireAdmin(req, "products");
  const id = Number((await ctx.params).id);
  const p = await prisma.product.findUnique({ where: { id }, select: { id: true, name: true, images: true, sku: true } });
  if (!p) throw new HttpError(404, "Producto no encontrado");

  const { imageUrl, imageIndex = 0, save = true } = Body.parse(await req.json().catch(() => ({})));
  const src = imageUrl?.trim() || p.images[imageIndex];
  if (!src) throw new HttpError(400, "Este producto no tiene fotos: añade una o indica una imagen");

  const url = await generateModel3dFromImage(src, p.name);
  if (save) {
    await prisma.product.update({ where: { id }, data: { model3dUrl: url } });
    await audit(u, "producto.modelo3d", `${p.sku} ← ${src}`);
  }
  return Response.json({ url, saved: save, source: src });
});
