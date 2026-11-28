import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, puedeEliminarProducto, errorPanel, textoPanel } from "@/lib/auth";
import { saveProduct } from "@/lib/catalog";
import { MAX_FOTOGRAMAS_360, MAX_FOTOS, MAX_VIDEOS } from "@/lib/medios";
import { VISTAS } from "@/lib/viewer";

const ProductBody = z.object({
  id: z.number().int().optional(), slug: z.string().max(80).optional(), sku: z.string().min(2).max(40), name: z.string().min(2).max(160),
  description: z.string().max(5000).default(""), priceUsd: z.number().min(0), compareAtUsd: z.number().min(0).nullish(),
  stock: z.number().int().min(0), lowStockAt: z.number().int().min(0).default(3),
  // Los topes se validan aquí además de en el panel: el formulario es comodidad,
  // la API es la que manda (una petición a mano no puede meter 200 fotos).
  images: z.array(z.string().max(500)).max(MAX_FOTOS).default([]),
  videos: z.array(z.string().max(500)).max(MAX_VIDEOS).default([]),
  model3dUrl: z.string().max(500).nullish(), model3dVideo: z.string().max(500).nullish(),
  spin360Frames: z.array(z.string().max(500)).max(MAX_FOTOGRAMAS_360).default([]),
  spin360Video: z.string().max(500).nullish(),
  viewerMode: z.enum(VISTAS).optional(),
  specs: z.record(z.string()).nullish(), featured: z.boolean().default(false), active: z.boolean().default(true),
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
  const row = (await saveProduct(input, id, { actor: u.name, source: "admin" })).row;
  await audit(u, "producto.guardar", row.sku);
  return Response.json(row);
});
export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  if (!puedeEliminarProducto(u)) throw await errorPanel(403, "Solo el administrador puede eliminar productos.", "Only the administrator can delete products.");
  const url = new URL(req.url);
  const pid = Number(url.searchParams.get("id"));
  if (!Number.isInteger(pid) || pid <= 0) throw await errorPanel(400, "Producto inválido", "Invalid product");
  const motivo = (url.searchParams.get("motivo") ?? (await textoPanel("Sin motivo indicado", "No reason given"))).slice(0, 120);
  const detalle = (url.searchParams.get("detalle") ?? "").slice(0, 300);
  const p = await prisma.product.findUnique({ where: { id: pid }, select: { sku: true, name: true, stock: true } });
  if (!p) throw await errorPanel(404, "Producto no encontrado", "Product not found");
  await prisma.product.update({ where: { id: pid }, data: { active: false } }); // baja lógica: conserva el historial
  await prisma.productMovement.create({
    data: {
      productId: pid, productName: p.name, sku: p.sku, kind: "BAJA", delta: 0,
      stockBefore: p.stock, stockAfter: p.stock,
      detail: await textoPanel(`Baja lógica: ${motivo}${detalle ? ` · ${detalle}` : ""}`, `Soft delete: ${motivo}${detalle ? ` · ${detalle}` : ""}`), actor: u.name, source: "admin",
    },
  });
  revalidateTag("producto");
  await audit(u, "producto.desactivar", `${p.sku} · ${p.name} · ${motivo}${detalle ? ` · ${detalle}` : ""}`);
  return Response.json({ ok: true });
});
