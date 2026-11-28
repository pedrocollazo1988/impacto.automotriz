import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, textoPanel } from "@/lib/auth";
import { invalidarCacheCatalogo, slugify } from "@/lib/catalog";

const Body = z.object({
  id: z.number().int().optional(),
  name: z.string().min(2).max(60),
  description: z.string().max(300).optional(),
  icon: z.string().max(40).optional(),
  position: z.number().int().min(0).max(999).optional(),
  visible: z.boolean().optional(),
});

export const GET = handle(async (req: Request) => {
  await requireAdmin(req, "products");
  const cats = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return Response.json(cats);
});

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const b = Body.parse(await req.json());
  const slug = slugify(b.name);

  // El slug es único en la base. Sin esta comprobación, renombrar una categoría
  // a un nombre ya existente lanzaría un error de Postgres poco claro.
  const choque = await prisma.category.findUnique({ where: { slug } });
  if (choque && choque.id !== b.id)
    return Response.json({ error: await textoPanel("Ya existe una categoría con ese nombre", "A category with that name already exists") }, { status: 409 });

  const datos = {
    name: b.name.trim(),
    slug,
    description: b.description?.trim() ?? "",
    icon: b.icon?.trim() ?? "",
    position: b.position ?? 0,
    visible: b.visible ?? true,
  };
  const fila = b.id
    ? await prisma.category.update({ where: { id: b.id }, data: datos })
    : await prisma.category.create({ data: datos });

  invalidarCacheCatalogo();
  await audit(u, b.id ? "categoria.editar" : "categoria.crear", fila.name);
  return Response.json({ ok: true, id: fila.id, slug: fila.slug });
});

export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!Number.isInteger(id)) return Response.json({ error: await textoPanel("Id inválido", "Invalid id") }, { status: 400 });

  const cat = await prisma.category.findUnique({ where: { id }, include: { _count: { select: { products: true } } } });
  if (!cat) return Response.json({ error: await textoPanel("No existe", "Not found") }, { status: 404 });
  // Borrar una categoría con productos los dejaría sin clasificar en silencio.
  if (cat._count.products > 0)
    return Response.json(
      { error: await textoPanel(`«${cat.name}» tiene ${cat._count.products} productos. Ocúltala en vez de borrarla, o muévelos antes a otra categoría.`, `“${cat.name}” has ${cat._count.products} products. Hide it instead of deleting it, or move them to another category first.`) },
      { status: 409 },
    );

  await prisma.category.delete({ where: { id } });
  invalidarCacheCatalogo();
  await audit(u, "categoria.borrar", cat.name);
  return Response.json({ ok: true });
});
