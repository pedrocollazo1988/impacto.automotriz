import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin } from "@/lib/auth";
import { buscarSeccion, limpiarItems } from "@/lib/contenido";
import { invalidarContenido } from "@/lib/contenido-server";

const ItemBody = z.object({
  icono: z.string().max(40).optional(),
  titulo: z.string().max(300).optional(),
  texto: z.string().max(2000).optional(),
  href: z.string().max(500).optional(),
  imagen: z.string().max(1000).optional(),
});

const Body = z.object({
  key: z.string().min(1).max(60),
  eyebrow: z.string().max(120).optional(),
  title: z.string().max(300).optional(),
  subtitle: z.string().max(2000).optional(),
  items: z.array(ItemBody).max(30).optional(),
  visible: z.boolean().optional(),
});

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "content");
  const b = Body.parse(await req.json());

  // Solo se aceptan claves declaradas: evita que el panel llene la tabla de
  // secciones que ninguna página lee.
  const seccion = buscarSeccion(b.key);
  if (!seccion) return Response.json({ error: "Sección desconocida" }, { status: 400 });

  const items = limpiarItems(b.items, seccion.maxItems);
  const datos = {
    eyebrow: b.eyebrow?.trim() ?? "",
    title: b.title?.trim() ?? "",
    subtitle: b.subtitle?.trim() ?? "",
    items,
    visible: b.visible ?? true,
    updatedBy: u.name,
  };

  await prisma.contentBlock.upsert({ where: { key: b.key }, create: { key: b.key, ...datos }, update: datos });
  invalidarContenido();
  await audit(u, "contenido.guardar", `${b.key} (${items.length} elementos)`);
  return Response.json({ ok: true });
});

export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "content");
  const key = new URL(req.url).searchParams.get("key") ?? "";
  if (!buscarSeccion(key)) return Response.json({ error: "Sección desconocida" }, { status: 400 });
  // Borrar la fila devuelve la sección al texto de fábrica, no la deja vacía.
  await prisma.contentBlock.deleteMany({ where: { key } });
  invalidarContenido();
  await audit(u, "contenido.restaurar", key);
  return Response.json({ ok: true });
});
