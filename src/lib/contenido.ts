// Contenido editable de la web pública.
//
// Cada sección tiene una clave estable y una lista de campos. Las páginas leen
// con `leerSeccion`, que devuelve el valor guardado en el panel o, si aún no hay
// nada guardado, el texto por defecto de aquí. Así la web nunca aparece vacía y
// el panel puede empezar a editar sin sembrar nada a mano.
//
// Este módulo lo importan páginas de servidor y el editor del panel: no debe
// tocar APIs de navegador.

import { SITE, telefono } from "./site";

export type Campo = {
  key: string;
  label: string;
  tipo?: "texto" | "parrafo" | "icono" | "url" | "imagen";
  /** Ancho completo en el editor, para los textos largos. */
  ancho?: boolean;
};

export type Seccion = {
  key: string;
  label: string;
  descripcion: string;
  /** Campos de la sección (encabezado). */
  campos: Campo[];
  /** Campos de cada elemento de la lista. Vacío = sección de un solo bloque. */
  camposItem?: Campo[];
  maxItems?: number;
  /** Valores de fábrica. Se usan mientras el panel no haya guardado nada. */
  defecto: { eyebrow?: string; title?: string; subtitle?: string; items?: Item[] };
};

export type Item = { icono?: string; titulo?: string; texto?: string; href?: string; imagen?: string };

export type Bloque = { eyebrow: string; title: string; subtitle: string; items: Item[]; visible: boolean };

const tituloTexto: Campo[] = [
  { key: "titulo", label: "Título", ancho: true },
  { key: "texto", label: "Texto", tipo: "parrafo", ancho: true },
];

const conIcono: Campo[] = [{ key: "icono", label: "Icono", tipo: "icono" }, ...tituloTexto];

export const SECCIONES: Seccion[] = [
  {
    key: "portada-valor",
    label: "Portada · ventajas",
    descripcion: "Las tarjetas de «Por qué comprar aquí» de la portada.",
    campos: [{ key: "title", label: "Título (solo lectores de pantalla)", ancho: true }],
    camposItem: conIcono,
    maxItems: 8,
    defecto: {
      title: "Por qué comprar en Impacto Automotriz",
      items: [
        { icono: "car", titulo: "Compatibilidad con tu vehículo", texto: "Guarda tu garaje y filtra solo las piezas que encajan con tu marca, modelo y año." },
        { icono: "truck", titulo: "Entrega en toda Cuba", texto: "Domicilio, mensajería, punto acordado o recogida en tienda, con tarifas por provincia y municipio." },
        { icono: "card", titulo: "Pago en línea seguro", texto: "Tropipay, QvaPay, transferencia o efectivo. Confirmación automática y comprobante de tu pedido." },
      ],
    },
  },
  {
    key: "portada-confianza",
    label: "Portada · franja de confianza",
    descripcion: "La franja corta de cuatro motivos, justo bajo la cabecera.",
    campos: [],
    camposItem: conIcono,
    maxItems: 4,
    defecto: {
      items: [
        { icono: "shield", titulo: "Pago seguro", texto: "Tropipay, QvaPay o al recibir" },
        { icono: "truck", titulo: "Entrega en Cuba", texto: "Las 15 provincias" },
        { icono: "refresh", titulo: "Garantía", texto: "30 días para reclamar" },
        { icono: "phone", titulo: "Asesoría", texto: "Te decimos qué pieza es" },
      ],
    },
  },
  {
    key: "portada-accesos",
    label: "Portada · accesos rápidos",
    descripcion: "Los cuatro botones grandes de la portada.",
    campos: [],
    camposItem: [...conIcono, { key: "href", label: "Enlace", tipo: "url" }],
    maxItems: 8,
    defecto: {
      items: [
        { icono: "grid", titulo: "Tienda virtual", texto: "Todo el catálogo con filtros por vehículo", href: "/catalogo" },
        { icono: "layers", titulo: "Despiece", texto: "Localiza la pieza sobre el plano", href: "/despiece" },
        { icono: "truck", titulo: "Transportación de carga", texto: "Traslado de mercancía y piezas con seguimiento", href: "/transportacion-de-carga" },
        { icono: "car", titulo: "Marcas y modelos", texto: "Consulta qué tenemos para tu vehículo", href: "/marcas-y-modelos" },
      ],
    },
  },
  {
    key: "servicios-postventa",
    label: "Servicios · postventa",
    descripcion: "Las tarjetas de servicios de posventa.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título de la página", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: conIcono,
    maxItems: 8,
    defecto: {
      eyebrow: "Qué hacemos",
      title: "Servicios",
      subtitle: "Además de vender piezas, te acompañamos después: mantenimiento, diagnóstico, reparación y asesoría para tu vehículo o tu flota.",
      items: [
        { icono: "wrench", titulo: "Mantenimiento preventivo", texto: "Revisión por kilometraje, cambio de filtros, líquidos y frenos con repuestos del catálogo." },
        { icono: "gauge", titulo: "Diagnóstico y reparación", texto: "Localizamos la avería y te decimos qué pieza hace falta antes de tocar nada." },
        { icono: "battery", titulo: "Sistemas eléctricos", texto: "Baterías, cargadores y motor de vehículos eléctricos y triciclos." },
        { icono: "shield", titulo: "Garantía de piezas", texto: "Cada repuesto que vendemos está respaldado; si falla, lo revisamos." },
      ],
    },
  },
  {
    key: "nosotros-valores",
    label: "Nosotros · valores",
    descripcion: "Las tarjetas de «Lo que nos distingue».",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título de la página", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: conIcono,
    maxItems: 8,
    defecto: {
      eyebrow: "Quiénes somos",
      title: "Impulsamos la movilidad de Cuba con piezas confiables",
      subtitle: "Impacto Automotriz S.U.R.L. es una tienda especializada en partes, piezas, accesorios automotrices y medios de transporte eléctrico. Nuestro objetivo es que encuentres la pieza correcta sin complicaciones, con información clara y entrega en todo el país.",
      items: [
        { icono: "shield", titulo: "Piezas con garantía", texto: "Trabajamos con proveedores seleccionados y respaldamos cada producto que vendemos." },
        { icono: "car", titulo: "Asesoría real", texto: "Te ayudamos a identificar la pieza correcta según la marca, modelo y año de tu vehículo." },
        { icono: "bolt", titulo: "Movilidad eléctrica", texto: "Impulsamos los medios de transporte eléctrico como solución eficiente y económica." },
        { icono: "truck", titulo: "Entrega nacional", texto: "Llegamos a toda Cuba con varias modalidades de entrega y seguimiento de tu pedido." },
      ],
    },
  },
  {
    key: "nosotros-cifras",
    label: "Nosotros · cifras",
    descripcion: "Los contadores de la página «Nosotros».",
    campos: [],
    camposItem: [{ key: "titulo", label: "Cifra" }, { key: "texto", label: "Qué representa" }],
    maxItems: 6,
    defecto: {
      items: [
        { titulo: "+100", texto: "productos en catálogo" },
        { titulo: "15", texto: "provincias con entrega" },
        { titulo: "24/7", texto: "tienda abierta" },
        { titulo: "100%", texto: "pago seguro" },
      ],
    },
  },
  {
    key: "contacto-datos",
    label: "Contacto · datos",
    descripcion: "Los datos de contacto y la dirección de la tienda.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [...conIcono, { key: "href", label: "Enlace (opcional)", tipo: "url" }],
    maxItems: 8,
    defecto: {
      eyebrow: "Atención al cliente",
      title: "Estamos para ayudarte",
      subtitle: "Consúltanos por WhatsApp con la marca, modelo y año de tu vehículo, o escríbenos por correo. Te respondemos lo antes posible.",
      items: [
        { icono: "mail", titulo: "Correo", texto: SITE.email },
        { icono: "clock", titulo: "Horario", texto: SITE.horario },
        { icono: "pin", titulo: "Tienda", texto: `${SITE.direccion}. Código postal 33800.` },
      ],
    },
  },
  {
    key: "faq",
    label: "Preguntas frecuentes",
    descripcion: "Las preguntas y respuestas. También alimentan los datos estructurados de Google.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [
      { key: "titulo", label: "Pregunta", ancho: true },
      { key: "texto", label: "Respuesta", tipo: "parrafo", ancho: true },
    ],
    maxItems: 30,
    defecto: {
      eyebrow: "Ayuda",
      title: "Preguntas frecuentes",
      subtitle: "Resolvemos las dudas más comunes sobre compras, pagos, entregas y compatibilidad de piezas.",
      items: [
        { titulo: "¿Cómo sé si una pieza es compatible con mi vehículo?", texto: "En cada ficha indicamos las marcas, modelos y años compatibles. Además, puedes buscar por vehículo desde el inicio o guardar tus vehículos en «Mi garaje» para ver solo piezas compatibles. Si tienes dudas, escríbenos por WhatsApp con la marca, modelo y año." },
        { titulo: "¿Qué métodos de pago aceptan?", texto: "Aceptamos Tropipay y QvaPay (pago en línea), transferencia bancaria y pago en efectivo contra entrega o en el local. La confirmación del pago en línea es automática; la transferencia y el efectivo los confirmamos manualmente." },
        { titulo: "¿Hacen entregas en toda Cuba?", texto: "Sí. Ofrecemos entrega a domicilio, mensajería a otras provincias, entrega en punto acordado y recogida en tienda. Las tarifas y los tiempos dependen de la provincia y el municipio." },
        { titulo: "¿Puedo comprar sin crear una cuenta?", texto: "Sí, puedes comprar como invitado. Crear una cuenta te permite seguir tus pedidos, guardar tu garaje, tu lista de deseos y valorar los productos que compres." },
        { titulo: "¿Qué es el visor 3D y la realidad aumentada?", texto: "En algunos productos puedes girar, acercar y ver la pieza en pantalla completa. En móviles compatibles, puedes verla en tu espacio real con la realidad aumentada. Si el modelo no puede mostrarse, verás la fotografía de respaldo." },
        { titulo: "¿Cómo sigo el estado de mi pedido?", texto: "Al confirmar la compra recibirás un número de pedido. Puedes consultar su estado en «Mi cuenta» o con el enlace del pedido. Te notificamos por correo cada cambio de estado." },
        { titulo: "¿Puedo devolver un producto?", texto: "Consulta nuestra política de devoluciones y garantía. Si la pieza no corresponde o llega con daños, contáctanos para gestionar el cambio o la devolución según las condiciones aplicables." },
        { titulo: "¿Tienen factura o comprobante?", texto: "Sí, cada pedido genera un comprobante imprimible que puedes guardar como PDF desde la página del pedido." },
      ],
    },
  },
  {
    key: "garantia-plazos",
    label: "Garantía · condiciones",
    descripcion: "Los puntos de «Qué cubre la garantía».",
    campos: [],
    camposItem: conIcono,
    maxItems: 8,
    defecto: {
      items: [
        { icono: "clock", titulo: "30 días", texto: "Desde la fecha de entrega para reclamar por defecto de fabricación." },
        { icono: "wrench", titulo: "Piezas y mano de obra", texto: "Si la pieza falla por defecto, la reponemos o devolvemos el importe." },
        { icono: "info", titulo: "No cubre el desgaste", texto: "El uso normal, una instalación incorrecta o daños por accidente no entran en garantía." },
      ],
    },
  },
  {
    key: "portada-hero",
    label: "Portada · encabezado",
    descripcion: "El texto principal, los botones y las cifras de la portada.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título (una línea por renglón)", tipo: "parrafo", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [...conIcono, { key: "href", label: "Enlace (vacío = cifra)", tipo: "url" }],
    maxItems: 8,
    defecto: {
      eyebrow: "Tienda oficial · {total}+ productos",
      title: "La pieza correcta\npara tu vehículo,\na la primera.",
      subtitle: "Catálogo de partes, piezas y accesorios con compatibilidad por vehículo y pago en línea.",
      items: [
        { icono: "grid", titulo: "Explorar catálogo", texto: "", href: "/catalogo" },
        { icono: "car", titulo: "Buscar por mi vehículo", texto: "", href: "/catalogo?vehiculo=1" },
        { titulo: "Entrega", texto: "En toda Cuba" },
        { titulo: "Pago", texto: "En línea o al recibir" },
        { titulo: "Soporte", texto: "WhatsApp directo" },
      ],
    },
  },
  {
    key: "portada-slider",
    label: "Portada · carrusel de ofertas",
    descripcion: "Banner de fotos que rota bajo la cabecera. Si lo dejas vacío, se usan las ofertas y los productos destacados.",
    campos: [],
    camposItem: [
      { key: "imagen", label: "Imagen (URL o /media/...)", tipo: "imagen", ancho: true },
      { key: "titulo", label: "Título", ancho: true },
      { key: "texto", label: "Texto / precio", ancho: true },
      { key: "href", label: "Enlace", tipo: "url", ancho: true },
      { key: "icono", label: "Icono", tipo: "icono" },
    ],
    maxItems: 8,
    defecto: { items: [] },
  },
  {
    key: "portada-categorias",
    label: "Portada · categorías",
    descripcion: "Encabezado de la sección de categorías.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: { eyebrow: "Explora por categoría", title: "Encuentra lo que buscas" },
  },
  {
    key: "portada-destacados",
    label: "Portada · destacados",
    descripcion: "Encabezado de los productos destacados.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: { eyebrow: "Lo más buscado", title: "Productos destacados" },
  },
  {
    key: "portada-ofertas",
    label: "Portada · ofertas",
    descripcion: "Encabezado y botón del bloque de ofertas.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [{ key: "titulo", label: "Texto del botón" }, { key: "href", label: "Enlace", tipo: "url" }],
    maxItems: 1,
    defecto: {
      eyebrow: "Precios rebajados",
      title: "Ofertas del momento",
      subtitle: "Piezas y accesorios con descuento por tiempo limitado.",
      items: [{ titulo: "Ver todas las ofertas", href: "/ofertas" }],
    },
  },
  {
    key: "portada-novedades",
    label: "Portada · novedades",
    descripcion: "Encabezado de los últimos productos.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: { eyebrow: "Recién llegado", title: "Novedades" },
  },
  {
    key: "portada-marcas",
    label: "Portada · marcas",
    descripcion: "Texto que introduce la tira de marcas.",
    campos: [{ key: "title", label: "Texto", ancho: true }],
    defecto: { title: "Trabajamos con las mejores marcas" },
  },
  {
    key: "portada-pasos",
    label: "Portada · cómo comprar",
    descripcion: "Los pasos de «Así compras tu pieza».",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
    ],
    camposItem: conIcono,
    maxItems: 6,
    defecto: {
      eyebrow: "Sin sorpresas",
      title: "Así compras tu pieza",
      items: [
        { icono: "search", titulo: "Busca tu pieza", texto: "Por el catálogo completo o filtrando por marca, modelo y año de tu vehículo." },
        { icono: "check", titulo: "Confirma la compatibilidad", texto: "Cada ficha indica para qué vehículos sirve. Si dudas, te lo revisamos por WhatsApp." },
        { icono: "card", titulo: "Paga en línea", texto: "Tropipay, QvaPay, transferencia o efectivo al recibir. Recibes tu comprobante al instante." },
        { icono: "truck", titulo: "Recíbela en tu provincia", texto: "Domicilio, mensajería o recogida en tienda, con la tarifa de tu municipio." },
      ],
    },
  },
  {
    key: "portada-cta",
    label: "Portada · cierre",
    descripcion: "El bloque final de «¿No encuentras la pieza?».",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [{ key: "titulo", label: "Texto del botón" }, { key: "href", label: "Enlace", tipo: "url" }],
    maxItems: 4,
    defecto: {
      title: "¿No encuentras la pieza?",
      subtitle: "Escríbenos por WhatsApp con la marca, modelo y año de tu vehículo y te ayudamos a localizarla.",
      items: [
        { titulo: "Contactar ahora", href: "/contacto" },
        { titulo: "Ver catálogo", href: "/catalogo" },
      ],
    },
  },
  {
    key: "contacto-mapa",
    label: "Contacto · mapa",
    descripcion: "Título y dirección que acompañan al mapa de la tienda.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Dirección", tipo: "parrafo", ancho: true },
    ],
    defecto: { title: "Nuestra tienda", subtitle: SITE.direccion },
  },
  {
    key: "novedades-hero",
    label: "Novedades · encabezado",
    descripcion: "El encabezado de la página de novedades.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      eyebrow: "Recién llegado",
      title: "Novedades",
      subtitle: "Lo último que ha entrado en el almacén. Ordenado por fecha de alta, para que veas antes que nadie lo que ya está disponible.",
    },
  },
  {
    key: "novedades-vacio",
    label: "Novedades · sin productos",
    descripcion: "El mensaje que se muestra cuando aún no hay productos.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Texto", tipo: "parrafo", ancho: true },
    ],
    defecto: { title: "Sin novedades por ahora", subtitle: "Cuando entre stock nuevo aparecerá aquí." },
  },
  {
    key: "testimonios-hero",
    label: "Testimonios · encabezado",
    descripcion: "El encabezado de la página de testimonios.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      eyebrow: "Opiniones",
      title: "Testimonios",
      subtitle: "Lo que dicen quienes ya han comprado. Solo publicamos reseñas de compras verificadas, y el administrador puede ocultar las que incumplan las normas.",
    },
  },
  {
    key: "testimonios-vacio",
    label: "Testimonios · sin reseñas",
    descripcion: "El mensaje que se muestra cuando aún no hay reseñas publicadas.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Texto", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      title: "Todavía no hay reseñas publicadas",
      subtitle: "Las reseñas se publican cuando un cliente que ha comprado deja su opinión. Si ya compraste, entra en tu cuenta y valora el producto.",
    },
  },
  {
    key: "nosotros-cta",
    label: "Nosotros · cierre",
    descripcion: "El bloque final de la página «Nosotros».",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [{ key: "titulo", label: "Texto del botón" }, { key: "href", label: "Enlace", tipo: "url" }],
    maxItems: 4,
    defecto: {
      title: "¿Listo para encontrar tu pieza?",
      items: [
        { titulo: "Explorar catálogo", href: "/catalogo" },
        { titulo: "Hablar con nosotros", href: "/contacto" },
      ],
    },
  },
  {
    key: "servicios-lineas",
    label: "Servicios · líneas de trabajo",
    descripcion: "Las tarjetas de servicios que aparecen al final de la página.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [...conIcono, { key: "href", label: "Enlace", tipo: "url" }],
    maxItems: 10,
    defecto: {
      title: "Nuestras líneas de trabajo",
      items: [
        { icono: "truck", titulo: "Renta y leasing", texto: "Flotas y vehículos eléctricos por temporada, con mantenimiento incluido.", href: "/renta" },
        { icono: "box", titulo: "Transportación de carga", texto: "Traslado de mercancía, piezas y equipos con seguimiento.", href: "/transportacion-de-carga" },
        { icono: "wrench", titulo: "Postventa", texto: "Mantenimiento, diagnóstico y reparación con repuestos originales.", href: "/servicios" },
        { icono: "grid", titulo: "Recambio vehicular", texto: "Partes, piezas y accesorios con compatibilidad por vehículo.", href: "/catalogo" },
        { icono: "info", titulo: "Asesoría técnica", texto: "Te decimos qué pieza necesitas antes de comprarla.", href: "/servicios" },
      ],
    },
  },
  {
    key: "renta-hero",
    label: "Renta · encabezado",
    descripcion: "El texto y los botones de la cabecera de Renta y leasing.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [...conIcono, { key: "href", label: "Enlace", tipo: "url" }],
    maxItems: 4,
    defecto: {
      eyebrow: "Servicios",
      title: "Renta y leasing de vehículos",
      subtitle: "Accede a un vehículo sin comprarlo. Te damos la unidad, el mantenimiento y el seguro, y tú te quedas con la operación.",
      items: [
        { icono: "truck", titulo: "Servicio de transportación de carga", texto: "", href: "/transportacion-de-carga" },
      ],
    },
  },
  {
    key: "renta-modalidades",
    label: "Renta · modalidades",
    descripcion: "Los planes de renta. La primera línea del texto es el plazo y las siguientes, las ventajas.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [
      { key: "icono", label: "Icono", tipo: "icono" },
      { key: "titulo", label: "Nombre del plan", ancho: true },
      { key: "texto", label: "Plazo y ventajas (una por línea)", tipo: "parrafo", ancho: true },
      { key: "href", label: "Enlace del botón", tipo: "url" },
    ],
    maxItems: 6,
    defecto: {
      title: "Modalidades",
      items: [
        { icono: "truck", titulo: "Renta por temporada", texto: "Desde 1 semana\nVehículo eléctrico o utilitario\nMantenimiento y seguro incluidos\nEntrega en Artemisa o La Habana\nSustitución si hay avería", href: "/contacto" },
        { icono: "card", titulo: "Leasing operativo", texto: "Desde 12 meses\nCuota mensual fija\nSin desembolso inicial grande\nServicio técnico en nuestra red\nOpción de compra al finalizar", href: "/contacto" },
        { icono: "battery", titulo: "Flota eléctrica", texto: "A medida\nEstudio de rutas y autonomía\nCargadores y formación\nMantenimiento preventivo\nInforme mensual de uso", href: "/contacto" },
      ],
    },
  },
  {
    key: "renta-cta",
    label: "Renta · cierre",
    descripcion: "El bloque final para empresas.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [{ key: "titulo", label: "Texto del botón" }, { key: "href", label: "Enlace", tipo: "url" }],
    maxItems: 2,
    defecto: {
      title: "¿Necesitas una flota para tu empresa?",
      subtitle: "Calculamos la cuota según los kilómetros previstos, el número de unidades y el plazo. Escríbenos y te preparamos la propuesta.",
      items: [{ titulo: "Contactar", href: "/contacto" }],
    },
  },
  {
    key: "garantia-hero",
    label: "Garantía · encabezado",
    descripcion: "El encabezado de la página de garantía.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      eyebrow: "Postventa",
      title: "Reclamar garantía",
      subtitle: "Si una pieza te ha dado problemas, dinos cuál es tu pedido y qué ocurre. Lo revisamos y te damos una solución.",
    },
  },
  {
    key: "carga-hero",
    label: "Carga · encabezado",
    descripcion: "El encabezado de la página de transportación de carga.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      eyebrow: "Servicios",
      title: "Transportación de carga",
      subtitle: "Movemos mercancía, piezas y equipos con vehículos adecuados, seguimiento y entrega coordinada en toda Cuba.",
    },
  },
  {
    key: "carga-servicios",
    label: "Carga · servicios",
    descripcion: "Las tarjetas de lo que se puede transportar.",
    campos: [{ key: "title", label: "Título", ancho: true }],
    camposItem: conIcono,
    maxItems: 8,
    defecto: {
      title: "Qué trasladamos",
      items: [
        { icono: "box", titulo: "Carga general", texto: "Mercancía, insumos y equipos de tamaño medio." },
        { icono: "wrench", titulo: "Piezas y repuestos", texto: "Partes delicadas, motores y componentes con embalaje protegido." },
        { icono: "truck", titulo: "Puerta a puerta", texto: "Recogida y entrega coordinada según la ruta y la provincia." },
      ],
    },
  },
  {
    key: "carga-cta",
    label: "Carga · cierre",
    descripcion: "El bloque final para solicitar una cotización.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [{ key: "titulo", label: "Texto del botón" }, { key: "href", label: "Enlace", tipo: "url" }],
    maxItems: 2,
    defecto: {
      title: "¿Necesitas mover una carga?",
      subtitle: "Cuéntanos qué llevas, desde dónde y hasta dónde. Te respondemos con la mejor opción y el costo.",
      items: [{ titulo: "Solicitar una cotización", href: "/contacto" }],
    },
  },
  {
    key: "ofertas-hero",
    label: "Ofertas · encabezado",
    descripcion: "El encabezado de la página de ofertas.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      eyebrow: "Ahorra en tus piezas",
      title: "Ofertas del momento",
      subtitle: "Precios rebajados por tiempo limitado en partes, piezas y accesorios. Aprovecha antes de que se agoten.",
    },
  },
  {
    key: "ofertas-vacio",
    label: "Ofertas · sin productos",
    descripcion: "El mensaje que se muestra cuando no hay ofertas activas.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Texto", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      title: "Aún no hay ofertas activas",
      subtitle: "Vuelve pronto o explora el catálogo completo mientras tanto.",
    },
  },
  {
    key: "marcas-hero",
    label: "Marcas · encabezado",
    descripcion: "El encabezado de la página de marcas y modelos.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      eyebrow: "Catálogo por marca",
      title: "Marcas y modelos",
      subtitle: "Consulta qué piezas tenemos para cada marca y encuentra la que encaja con tu vehículo. La disponibilidad cambia a diario, así que confirma con nosotros si no la ves.",
    },
  },
  {
    key: "despiece-hero",
    label: "Despiece · encabezado",
    descripcion: "El encabezado de la página de despiece.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      eyebrow: "Despiece interactivo",
      title: "Encuentra la pieza exacta",
      subtitle: "Elige tu vehículo y navega por sistemas. Cada número del dibujo abre la ficha de la pieza con su código, sus medidas y el botón de compra, sin riesgo de confundir la versión.",
    },
  },
  {
    key: "catalogo-hero",
    label: "Catálogo · encabezado",
    descripcion: "El encabezado de la página del catálogo.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    defecto: {
      eyebrow: "Tienda",
      title: "Catálogo",
      subtitle: "Piezas, accesorios y transporte eléctrico con compatibilidad por vehículo.",
    },
  },
  {
    key: "politicas-envios",
    label: "Políticas · envíos",
    descripcion: "El contenido de la política de envíos y entrega.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [
      { key: "titulo", label: "Apartado", ancho: true },
      { key: "texto", label: "Texto", tipo: "parrafo", ancho: true },
    ],
    maxItems: 20,
    defecto: {
      title: "Envíos y entrega",
      subtitle: "Trabajamos con varias modalidades de entrega para que recibas tus piezas donde las necesites, en toda Cuba.",
      items: [
        { titulo: "Modalidades", texto: "Entrega a domicilio, mensajería a otras provincias, entrega en punto acordado y recogida en tienda. La disponibilidad depende de tu provincia y municipio y se muestra durante el checkout." },
        { titulo: "Tarifas", texto: "El costo del envío se calcula automáticamente según el método elegido, la provincia y el municipio. Algunos métodos son gratuitos a partir de un importe mínimo de compra." },
        { titulo: "Plazos", texto: "El plazo estimado se muestra al seleccionar el método de entrega. Los pedidos se preparan tras la confirmación del pago." },
        { titulo: "Seguimiento", texto: "Recibirás un código de confirmación y podrás consultar el estado de tu pedido en cualquier momento." },
      ],
    },
  },
  {
    key: "politicas-devoluciones",
    label: "Políticas · devoluciones",
    descripcion: "El contenido de la política de devoluciones y garantía.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [
      { key: "titulo", label: "Apartado", ancho: true },
      { key: "texto", label: "Texto", tipo: "parrafo", ancho: true },
    ],
    maxItems: 20,
    defecto: {
      title: "Devoluciones y garantía",
      subtitle: "Queremos que compres con confianza. Si algo no sale como esperabas, estamos para ayudarte.",
      items: [
        { titulo: "Garantía", texto: "Las piezas y accesorios cuentan con la garantía del vendedor frente a defectos de fabricación. El plazo puede variar según el producto." },
        { titulo: "Cambios y devoluciones", texto: "Si la pieza no corresponde a lo solicitado o llega con daños, contáctanos dentro de las primeras 48 horas con fotos y tu número de pedido para gestionar el cambio o la devolución." },
        { titulo: "Condiciones", texto: "El producto debe conservar su estado y embalaje original. Los gastos de envío de la devolución pueden variar según el caso." },
        { titulo: "Reembolsos", texto: "Cuando corresponda un reembolso, se realiza por el mismo medio de pago o mediante un vale de compra, según acordemos." },
      ],
    },
  },
  {
    key: "politicas-privacidad",
    label: "Políticas · privacidad",
    descripcion: "El contenido de la política de privacidad.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [
      { key: "titulo", label: "Apartado", ancho: true },
      { key: "texto", label: "Texto", tipo: "parrafo", ancho: true },
    ],
    maxItems: 20,
    defecto: {
      title: "Política de privacidad",
      subtitle: "Protegemos tus datos personales y los usamos solo para gestionar tus pedidos y mejorar tu experiencia.",
      items: [
        { titulo: "Datos que recopilamos", texto: "Nombre, correo, teléfono y dirección de entrega, necesarios para procesar y entregar tu pedido. Si creas una cuenta, también guardamos tu garaje, lista de deseos y valoraciones." },
        { titulo: "Uso de los datos", texto: "Utilizamos tus datos para gestionar pedidos, enviarte notificaciones relacionadas y, si lo autorizas, enviarte novedades. No vendemos tus datos a terceros." },
        { titulo: "Seguridad", texto: "Aplicamos medidas técnicas para proteger tu información. Las contraseñas se almacenan cifradas." },
        { titulo: "Tus derechos", texto: "Puedes solicitar el acceso, la corrección o la eliminación de tus datos escribiéndonos por los canales de contacto." },
      ],
    },
  },
  {
    key: "politicas-terminos",
    label: "Políticas · términos",
    descripcion: "El contenido de los términos de uso.",
    campos: [
      { key: "title", label: "Título", ancho: true },
      { key: "subtitle", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [
      { key: "titulo", label: "Apartado", ancho: true },
      { key: "texto", label: "Texto", tipo: "parrafo", ancho: true },
    ],
    maxItems: 20,
    defecto: {
      title: "Términos de uso",
      subtitle: "Estas condiciones regulan el uso de la tienda y la compra de productos en Impacto Automotriz.",
      items: [
        { titulo: "Productos y precios", texto: "Los precios se muestran en USD y pueden actualizarse. El importe final se confirma al crear el pedido. Las imágenes son ilustrativas y pueden variar ligeramente del producto real." },
        { titulo: "Pedidos", texto: "Un pedido queda confirmado tras la validación del pago y la verificación de existencias. Nos reservamos el derecho de cancelar pedidos con datos incorrectos o falta de stock, con reembolso total." },
        { titulo: "Compatibilidad", texto: "La compatibilidad de las piezas se ofrece según los datos del fabricante y del vendedor. Recomendamos confirmar con los datos exactos de tu vehículo antes de comprar." },
        { titulo: "Uso del sitio", texto: "Te comprometes a usar el sitio de forma lícita y a no interferir con su funcionamiento." },
      ],
    },
  },
  {
    key: "facturacion",
    label: "Prefactura · datos de la MIPYME",
    descripcion: "Estos datos salen en la prefactura de cada pedido: nombre, NIT, domicilio, cuentas, representante y firmas.",
    campos: [
      { key: "title", label: "Título del documento", ancho: true },
      { key: "subtitle", label: "Nota legal o pie de página", tipo: "parrafo", ancho: true },
    ],
    camposItem: [
      { key: "titulo", label: "Dato", ancho: true },
      { key: "texto", label: "Valor", tipo: "parrafo", ancho: true },
    ],
    maxItems: 16,
    defecto: {
      title: "PREFACTURA",
      subtitle: "Documento no fiscal. El importe queda confirmado cuando se valida el pago.",
      items: [
        { titulo: "Nombre de la MIPYME", texto: SITE.razonSocial },
        { titulo: "NIT", texto: "" },
        { titulo: "Domicilio social", texto: SITE.direccion },
        { titulo: "Cuenta bancaria CUP", texto: "" },
        { titulo: "Cuenta bancaria USD", texto: "" },
        { titulo: "Representante legal", texto: "" },
        { titulo: "Teléfonos", texto: telefono },
        { titulo: "Correo", texto: SITE.email },
        { titulo: "Emitido por", texto: SITE.razonSocial },
        { titulo: "Recibido por", texto: "Cliente" },
      ],
    },
  },
  {
    key: "carrito-config",
    label: "Carrito · caducidad",
    descripcion: "Cuánto tiempo se guardan los productos elegidos y qué aviso ve el cliente.",
    campos: [],
    camposItem: [
      { key: "titulo", label: "Concepto", ancho: true },
      { key: "texto", label: "Valor", tipo: "parrafo", ancho: true },
    ],
    maxItems: 3,
    defecto: {
      items: [
        { titulo: "Horas que se guarda el carrito", texto: "24" },
        { titulo: "Aviso al cliente", texto: "Tus productos se guardan 24 horas. Si no confirmas el pedido, el carrito se vacía y las unidades vuelven a estar disponibles." },
      ],
    },
  },
];

export const buscarSeccion = (key: string) => SECCIONES.find((s) => s.key === key);

/** Normaliza lo que llega del panel: descarta elementos vacíos y limita el número. */
export function limpiarItems(items: unknown, max = 30): Item[] {
  if (!Array.isArray(items)) return [];
  return items
    .filter((i): i is Record<string, unknown> => !!i && typeof i === "object")
    .map((i) => ({
      icono: typeof i.icono === "string" ? i.icono.slice(0, 40) : undefined,
      titulo: typeof i.titulo === "string" ? i.titulo.slice(0, 300) : undefined,
      texto: typeof i.texto === "string" ? i.texto.slice(0, 2000) : undefined,
      href: typeof i.href === "string" ? i.href.slice(0, 500) : undefined,
      imagen: typeof i.imagen === "string" && /^(\/(?!\/)|https?:\/\/)/i.test(i.imagen) ? i.imagen.slice(0, 1000) : undefined,
    }))
    .filter((i) => i.titulo || i.texto || i.imagen)
    .slice(0, max);
}

/** Mezcla lo guardado con el valor de fábrica, campo a campo. */
export function componer(seccion: Seccion, fila?: { eyebrow: string; title: string; subtitle: string; items: unknown; visible: boolean } | null): Bloque {
  const d = seccion.defecto;
  const items = limpiarItems(fila?.items, seccion.maxItems);
  return {
    eyebrow: fila?.eyebrow || d.eyebrow || "",
    title: fila?.title || d.title || "",
    subtitle: fila?.subtitle || d.subtitle || "",
    items: items.length ? items : (d.items ?? []),
    visible: fila ? fila.visible : true,
  };
}
