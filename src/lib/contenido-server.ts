import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { componer, SECCIONES, buscarSeccion, type Bloque } from "./contenido";
import { enContenido } from "./contenido-en";
import { getLang } from "./i18n";

// Lectura del contenido editable. Se cachea con la misma idea que categorías y
// marcas: los textos cambian poco y se piden en cada visita. Al guardar desde el
// panel se invalida el tag, así el cambio se ve al instante sin recompilar.
const TAG = "contenido";

/** Idiomas en los que el panel puede escribir cada sección. */
export const IDIOMAS_CONTENIDO = ["es", "en"] as const;
export type IdiomaContenido = (typeof IDIOMAS_CONTENIDO)[number];

/** Fila de `ContentBlock` tal como la leen el panel y este módulo. */
export type FilaContenido = {
  key: string;
  lang: string;
  eyebrow: string;
  title: string;
  subtitle: string;
  items: unknown;
  visible: boolean;
};

export const invalidarContenido = () => revalidateTag(TAG);

const idiomaDeFila = (f: FilaContenido): IdiomaContenido => (f.lang === "en" ? "en" : "es");

/** Traduce lo que venga del texto de fábrica y deja intacto lo que escribió el
 *  panel: un texto que no está en `TEXTO_EN` lo escribió una persona en español,
 *  y no se inventa su traducción. */
export function traducirBloque(bloque: Bloque, lang: IdiomaContenido): Bloque {
  if (lang !== "en") return bloque;
  const tr = (texto?: string) => enContenido(texto ?? "", lang);
  return {
    ...bloque,
    eyebrow: tr(bloque.eyebrow),
    title: tr(bloque.title),
    subtitle: tr(bloque.subtitle),
    items: bloque.items.map((i) => ({
      ...i,
      titulo: tr(i.titulo),
      texto: tr(i.texto),
      parrafos: i.parrafos ? i.parrafos.split("\n\n").map((x) => enContenido(x, lang)).join("\n\n") : i.parrafos,
      puntos: i.puntos ? i.puntos.split("\n").map((x) => enContenido(x, lang)).join("\n") : i.puntos,
    })),
  };
}

/** Compone las secciones de un idioma a partir de sus filas: lo guardado manda y
 *  lo que falte cae al texto de fábrica (traducido si el idioma es inglés). */
export function componerSecciones(filas: FilaContenido[], lang: IdiomaContenido): Record<string, Bloque> {
  const porClave = new Map(filas.filter((f) => idiomaDeFila(f) === lang).map((f) => [f.key, f]));
  return Object.fromEntries(
    SECCIONES.map((s) => [s.key, traducirBloque(componer(s, porClave.get(s.key) ?? null), lang)]),
  );
}

/**
 * Contenido de los dos idiomas a la vez, para que una sola entrada de caché
 * sirva a cualquier visitante. `en` deja `null` en las secciones que aún no se
 * tradujeron: con eso `leerSeccion` sabe cuándo debe caer al español.
 */
export const getContenidoCached = unstable_cache(
  async () => {
    const filas = (await prisma.contentBlock.findMany().catch(() => [])) as unknown as FilaContenido[];
    const filaEn = new Map(filas.filter((f) => idiomaDeFila(f) === "en").map((f) => [f.key, f]));
    return {
      es: componerSecciones(filas, "es"),
      en: Object.fromEntries(
        SECCIONES.map((s) => {
          const fila = filaEn.get(s.key);
          return [s.key, fila ? traducirBloque(componer(s, fila), "en") : null];
        }),
      ) as Record<string, Bloque | null>,
    };
  },
  ["contenido-web"],
  { revalidate: 3600, tags: [TAG] },
);

/** Una sección concreta. Nunca devuelve vacío: cae al texto por defecto.
 *  Manda la fila del idioma del visitante; si esa sección no se tradujo, se sirve
 *  la española con los textos de fábrica traducidos. Lo que el panel escribió en
 *  español se deja en español: no se inventa traducción. */
export async function leerSeccion(key: string): Promise<Bloque> {
  const [todo, lang] = await Promise.all([getContenidoCached(), getLang()]);
  const seccion = buscarSeccion(key);
  const vacio: Bloque = { eyebrow: "", title: "", subtitle: "", items: [], visible: true };

  if (lang === "en") {
    const ingles = todo.en[key];
    if (ingles) return ingles;
  }
  const base = todo.es[key] ?? (seccion ? componer(seccion, null) : vacio);
  return lang === "en" ? traducirBloque(base, "en") : base;
}
