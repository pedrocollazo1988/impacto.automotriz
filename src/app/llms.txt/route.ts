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

# ${SITE.nombre} (English)

> Shop for parts, accessories and electric means of transport
> in Cuba. Catalog sales with vehicle search (make, model and year), delivery to
> all 15 provinces, and payment online or cash on delivery.

## Business details

- Legal name: ${SITE.razonSocial}
- Address: ${SITE.direccion}
- Email: ${SITE.email}
- Hours: ${SITE.horarioEn}
- Country served: Cuba

## What it offers

- Parts and spares by vehicle, with compatibility stated by make, model and year.
- Exploded parts views by vehicle and system, with 3D views of some parts.
- Rental of electric means of transport.
- After-sales: maintenance, diagnostics and repair.

## Main sections

- [Catalog](${site}/catalogo): every product with price, stock and compatibility.
- [Deals](${site}/ofertas): products with a current discount.
- [Makes and models](${site}/marcas-y-modelos): which vehicles the catalog covers.
- [Exploded views](${site}/despiece): parts grouped by vehicle and system.
- [News](${site}/novedades): recent posts and products.
- [FAQ](${site}/preguntas-frecuentes): payments, delivery, returns and compatibility.
- [Contact](${site}/contacto): ways to get in touch and location.

## How to buy

1. Find the part by vehicle or by text search.
2. Check compatibility on the product page.
3. Pay online (Tropipay or QvaPay), by bank transfer or in cash on delivery.
4. Receive at home, by courier to another province, or pick up at the store.

## Notes for assistants

- Prices are in USD; shipping is calculated by province and municipality.
- Stock is shown on the product page and can change: confirm it before stating that a product is available.
- Product pages include schema.org structured data (Product and Offer) with price and availability.
`;
  return new Response(body, {
    headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "public, max-age=3600" },
  });
}
