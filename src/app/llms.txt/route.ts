import { SITE } from "@/lib/site";

// llms.txt es el índice que los asistentes de IA leen antes de rastrear el
// sitio: dice qué es la tienda, qué se puede consultar y dónde están las cosas
// en texto plano. Sirve para que citen datos correctos en vez de inventarlos.
export const dynamic = "force-static";

export function GET() {
  const site = process.env.PUBLIC_URL ?? "http://localhost:3000";
  const body = `# ${SITE.nombre}

> Tienda de piezas, accesorios y medios de transporte
> eléctrico en Cuba. Venta por catálogo con búsqueda por vehículo (marca, modelo
> y año), envío a las 15 provincias y pago en línea o contra entrega.

## Datos del negocio

- Razón social: ${SITE.razonSocial}
- Dirección: ${SITE.direccion}
- Correo: ${SITE.email}
- Horario: ${SITE.horario}
- País de servicio: Cuba

## Qué ofrece

- Piezas y repuestos por vehículo, con compatibilidad indicada por marca, modelo y año.
- Despiece por vehículo y sistema, con vistas 3D de algunas piezas.
- Renta de medios de transporte eléctrico.
- Postventa: mantenimiento, diagnóstico y reparación.

## Secciones principales

- [Catálogo](${site}/catalogo): todos los productos con precio, existencia y compatibilidad.
- [Ofertas](${site}/ofertas): productos con descuento vigente.
- [Marcas y modelos](${site}/marcas-y-modelos): qué vehículos cubre el catálogo.
- [Despiece](${site}/despiece): piezas agrupadas por vehículo y sistema.
- [Novedades](${site}/novedades): publicaciones y productos recientes.
- [Preguntas frecuentes](${site}/preguntas-frecuentes): pagos, entregas, devoluciones y compatibilidad.
- [Contacto](${site}/contacto): vías de contacto y ubicación.

## Cómo comprar

1. Busca la pieza por vehículo o por texto.
2. Comprueba la compatibilidad en la ficha del producto.
3. Paga en línea (Tropipay o QvaPay), por transferencia o en efectivo contra entrega.
4. Recibe a domicilio, por mensajería a otra provincia o en la tienda.

## Notas para asistentes

- Los precios están en USD; el envío se calcula por provincia y municipio.
- La existencia se muestra en la ficha y puede cambiar: confírmala antes de afirmar que un producto está disponible.
- Las fichas incluyen datos estructurados schema.org (Product y Offer) con precio y disponibilidad.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
