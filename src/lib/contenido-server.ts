import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { componer, SECCIONES, buscarSeccion, type Bloque } from "./contenido";

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

/** Una sección concreta. Nunca devuelve vacío: cae al texto por defecto. */
export async function leerSeccion(key: string): Promise<Bloque> {
  const todo = await getContenidoCached();
  if (todo[key]) return todo[key];
  const s = buscarSeccion(key);
  return s ? componer(s, null) : { eyebrow: "", title: "", subtitle: "", items: [], visible: true };
}
