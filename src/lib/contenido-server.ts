import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { componer, SECCIONES, buscarSeccion, type Bloque } from "./contenido";
import { enContenido } from "./contenido-en";
import { getLang } from "./i18n";

// Lectura del contenido editable. Se cachea con la misma idea que categorías y
// marcas: los textos cambian poco y se piden en cada visita. Al guardar desde el
// panel se invalida el tag, así el cambio se ve al instante sin recompilar.
const TAG = "contenido";

export const invalidarContenido = () => revalidateTag(TAG);

/** Todas las secciones ya compuestas con su valor de fábrica como respaldo. */
export const getContenidoCached = unstable_cache(
  async () => {
    const filas = await prisma.contentBlock.findMany().catch(() => []);
    const porClave = new Map(filas.map((f) => [f.key, f]));
    return Object.fromEntries(SECCIONES.map((s) => [s.key, componer(s, porClave.get(s.key) ?? null)])) as Record<string, Bloque>;
  },
  ["contenido-web"],
  { revalidate: 3600, tags: [TAG] },
);

/** Una sección concreta. Nunca devuelve vacío: cae al texto por defecto.
 *  En inglés se traducen los textos de fábrica; lo que haya escrito el panel
 *  se queda tal cual, porque está guardado en un solo idioma. */
export async function leerSeccion(key: string): Promise<Bloque> {
  const todo = await getContenidoCached();
  const bloque = todo[key] ?? (buscarSeccion(key) ? componer(buscarSeccion(key)!, null) : { eyebrow: "", title: "", subtitle: "", items: [], visible: true });
  const lang = await getLang();
  if (lang !== "en") return bloque;
  return {
    ...bloque,
    eyebrow: enContenido(bloque.eyebrow, lang),
    title: enContenido(bloque.title, lang),
    subtitle: enContenido(bloque.subtitle, lang),
    items: bloque.items.map((i) => ({
      ...i,
      titulo: enContenido(i.titulo || "", lang),
      texto: enContenido(i.texto || "", lang),
      parrafos: i.parrafos ? i.parrafos.split("\n\n").map((x) => enContenido(x, lang)).join("\n\n") : i.parrafos,
      puntos: i.puntos ? i.puntos.split("\n").map((x) => enContenido(x, lang)).join("\n") : i.puntos,
    })),
  };
}
