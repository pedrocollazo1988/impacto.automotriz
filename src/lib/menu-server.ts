import { unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { buscarSeccion, componer, type Item } from "./contenido";
import type { Enlace } from "./site";

// Enlaces de los menús editables. La cabecera y el pie solo necesitan href y
// etiqueta, así que se leen aparte del resto del contenido y se cachean con el
// mismo tag: al guardar una sección en el panel se refrescan al instante.

const TAG = "contenido";

const esHrefSeguro = (href: string) => /^\/(?!\/)/.test(href) || /^https?:\/\//i.test(href);

const enlaceDe = (it: Item): Enlace[] => {
  const label = it.titulo?.trim();
  const href = it.href?.trim() ?? "";
  // Solo rutas internas o http(s): un enlace guardado no debe poder inyectar
  // `javascript:` en la cabecera.
  if (!label || !esHrefSeguro(href)) return [];
  return [{ href, label }];
};

async function leerMenu(key: string): Promise<Enlace[]> {
  const seccion = buscarSeccion(key);
  if (!seccion) return [];
  const porDefecto = (seccion.defecto.items ?? []).flatMap(enlaceDe);
  try {
    const fila = await prisma.contentBlock.findFirst({ where: { key, lang: "es" } });
    if (!fila) return porDefecto;
    const enlaces = componer(seccion, fila).items.flatMap(enlaceDe);
    return enlaces.length ? enlaces : porDefecto;
  } catch {
    // Sin base de datos (o con la tabla aún sin crear) la web sigue navegable.
    return porDefecto;
  }
}

const menuCached = unstable_cache((key: string) => leerMenu(key), ["menu-web"], {
  revalidate: 3600,
  tags: [TAG],
});

async function leer(key: string): Promise<Enlace[]> {
  try {
    return await menuCached(key);
  } catch {
    // Fuera del runtime de Next (pruebas, scripts) no hay caché incremental.
    return leerMenu(key);
  }
}

export const getMenuPrincipal = () => leer("menu-principal");
export const getMenuEmpresa = () => leer("menu-empresa");
