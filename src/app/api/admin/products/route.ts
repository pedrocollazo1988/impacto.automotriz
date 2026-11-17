import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin } from "@/lib/auth";
import { saveProduct } from "@/lib/catalog";

const ProductBody = z.object({
  id: z.number().int().optional(), slug: z.string().max(80).optional(), sku: z.string().min(2).max(40), name: z.string().min(2).max(160),
  description: z.string().max(5000).default(""), priceUsd: z.number().min(0), compareAtUsd: z.number().min(0).nullish(),
  stock: z.number().int().min(0), lowStockAt: z.number().int().min(0).default(3), images: z.array(z.string().max(500)).max(10).default([]),
  model3dUrl: z.string().url().nullish().or(z.literal("")), specs: z.record(z.string()).nullish(), featured: z.boolean().default(false), active: z.boolean().default(true),
  variants: z.array(z.object({ sku: z.string().min(2).max(40), name: z.string().min(1).max(80), priceUsd: z.number().min(0).nullish(), stock: z.number().int().min(0), active: z.boolean().default(true) })).max(50).optional(),
  categoryName: z.string().min(2).max(60), brandName: z.string().max(60).nullish(),
  fits: z.array(z.object({ make: z.string().min(1), model: z.string().min(1), yearFrom: z.number().int(), yearTo: z.number().int() })).default([]),
});

export const GET = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  return Response.json(await prisma.product.findMany({ orderBy: { id: "desc" }, include: { fits: true, category: true, brand: true } }));
});
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const { id, ...input } = ProductBody.parse(await req.json());
  const row = (await saveProduct(input, id)).row;
  await audit(u, "producto.guardar", row.sku);
  return Response.json(row);
});
export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const pid = Number(new URL(req.url).searchParams.get("id"));
  await audit(u, "producto.desactivar", String(pid));
  await prisma.product.update({ where: { id: pid }, data: { active: false } }); // baja lógica: conserva el historial
  return Response.json({ ok: true });
});
