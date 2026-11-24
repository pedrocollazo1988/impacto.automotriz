import type { Seccion } from "./contenido";

// Orden en el que el visitante recorre la web. El editor del panel usa esta
// lista para que los bloques aparezcan agrupados por página y en el mismo
// orden que el contenido real.
export const ORDEN_WEB = [
  "portada-hero",
  "portada-slider",
  "portada-confianza",
  "portada-accesos",
  "portada-valor",
  "portada-categorias",
  "portada-destacados",
  "portada-ofertas",
  "portada-novedades",
  "portada-marcas",
  "portada-pasos",
  "portada-cta",
  "catalogo-hero",
  "ofertas-hero",
  "ofertas-vacio",
  "marcas-hero",
  "despiece-hero",
  "servicios-postventa",
  "servicios-lineas",
  "renta-hero",
  "renta-modalidades",
  "renta-cta",
  "nosotros-valores",
  "nosotros-cifras",
  "nosotros-cta",
  "contacto-datos",
  "contacto-mapa",
  "faq",
  "garantia-hero",
  "garantia-plazos",
  "novedades-hero",
  "novedades-vacio",
  "testimonios-hero",
  "testimonios-vacio",
  "carga-hero",
  "carga-servicios",
  "carga-cta",
  "politicas-envios",
  "politicas-devoluciones",
  "politicas-privacidad",
  "politicas-terminos",
  "facturacion",
  "carrito-config",
] as const;

const posicion = new Map<string, number>(ORDEN_WEB.map((key, i) => [key, i]));

export function ordenarSecciones(secciones: Seccion[]): Seccion[] {
  return [...secciones].sort((a, b) => {
    const pa = posicion.get(a.key) ?? Number.MAX_SAFE_INTEGER;
    const pb = posicion.get(b.key) ?? Number.MAX_SAFE_INTEGER;
    return pa === pb ? a.label.localeCompare(b.label, "es") : pa - pb;
  });
}

export function grupoDe(seccion: Seccion): string {
  return seccion.label.split(" · ")[0] || "General";
}
