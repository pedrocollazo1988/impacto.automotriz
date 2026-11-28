import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, textoPanel } from "@/lib/auth";
import { buscarSeccion, limpiarItems } from "@/lib/contenido";
import { invalidarContenido } from "@/lib/contenido-server";

const ItemBody = z.object({
  icono: z.string().max(40).optional(),
  titulo: z.string().max(300).optional(),
  texto: z.string().max(2000).optional(),
  href: z.string().max(500).optional(),
  imagen: z.string().max(1000).optional(),
  fecha: z.string().max(40).optional(),
  marca: z.string().max(120).optional(),
  lectura: z.string().max(20).optional(),
  parrafos: z.string().max(20000).optional(),
  puntos: z.string().max(4000).optional(),
});

// Cada sección se guarda una vez por idioma: la clave es (key, lang).
const Lang = z.enum(["es", "en"]);

const Body = z.object({
  key: z.string().min(1).max(60),
  lang: Lang.default("es"),
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
  if (!seccion) return Response.json({ error: await textoPanel("Sección desconocida", "Unknown section") }, { status: 400 });

  const items = limpiarItems(b.items, seccion.maxItems);
  const datos = {
    eyebrow: b.eyebrow?.trim() ?? "",
    title: b.title?.trim() ?? "",
    subtitle: b.subtitle?.trim() ?? "",
    items,
    visible: b.visible ?? true,
    updatedBy: u.name,
  };

  await prisma.contentBlock.upsert({
    where: { key_lang: { key: b.key, lang: b.lang } },
    create: { key: b.key, lang: b.lang, ...datos },
    update: datos,
  });
  invalidarContenido();
  await audit(u, "contenido.guardar", `${b.key} [${b.lang}] (${await textoPanel(`${items.length} elementos`, `${items.length} items`)})`);
  return Response.json({ ok: true });
});

export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "content");
  const params = new URL(req.url).searchParams;
  const key = params.get("key") ?? "";
  if (!buscarSeccion(key)) return Response.json({ error: await textoPanel("Sección desconocida", "Unknown section") }, { status: 400 });
  const lang = Lang.safeParse(params.get("lang") ?? "es").data ?? "es";
  // Borrar la fila devuelve la sección al texto de fábrica de ese idioma, no la
  // deja vacía; el otro idioma conserva lo que tenga guardado.
  await prisma.contentBlock.deleteMany({ where: { key, lang } });
  invalidarContenido();
  await audit(u, "contenido.restaurar", `${key} [${lang}]`);
  return Response.json({ ok: true });
});
