// Contenido editable de la web pública.
//
// Cada sección tiene una clave estable y una lista de campos. Las páginas leen
// con `leerSeccion`, que devuelve el valor guardado en el panel o, si aún no hay
// nada guardado, el texto por defecto de aquí. Así la web nunca aparece vacía y
// el panel puede empezar a editar sin sembrar nada a mano.
//
// Este módulo lo importan páginas de servidor y el editor del panel: no debe
// tocar APIs de navegador.

export type Campo = {
  key: string;
  label: string;
  tipo?: "texto" | "parrafo" | "icono" | "url";
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

export type Item = { icono?: string; titulo?: string; texto?: string; href?: string };

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
    campos: [{ key: "titulo", label: "Título (solo lectores de pantalla)", ancho: true }],
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
        { icono: "truck", titulo: "Renta y leasing", texto: "Flotas con mantenimiento incluido", href: "/renta" },
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
      { key: "titulo", label: "Título de la página", ancho: true },
      { key: "subtitulo", label: "Entradilla", tipo: "parrafo", ancho: true },
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
      { key: "titulo", label: "Título de la página", ancho: true },
      { key: "subtitulo", label: "Entradilla", tipo: "parrafo", ancho: true },
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
      { key: "titulo", label: "Título", ancho: true },
      { key: "subtitulo", label: "Entradilla", tipo: "parrafo", ancho: true },
    ],
    camposItem: [...conIcono, { key: "href", label: "Enlace (opcional)", tipo: "url" }],
    maxItems: 8,
    defecto: {
      eyebrow: "Atención al cliente",
      title: "Estamos para ayudarte",
      subtitle: "Consúltanos por WhatsApp con la marca, modelo y año de tu vehículo, o escríbenos por correo. Te respondemos lo antes posible.",
      items: [
        { icono: "mail", titulo: "Correo", texto: "ventas@impactoautomotriz.cu" },
        { icono: "clock", titulo: "Horario", texto: "Lunes a sábado, 9:00 – 18:00" },
        { icono: "pin", titulo: "Tienda", texto: "Calle 29 No. 5408 e/ 54 y 56, Artemisa, Cuba. Código postal 33800." },
      ],
    },
  },
  {
    key: "faq",
    label: "Preguntas frecuentes",
    descripcion: "Las preguntas y respuestas. También alimentan los datos estructurados de Google.",
    campos: [
      { key: "eyebrow", label: "Antetítulo", ancho: true },
      { key: "titulo", label: "Título", ancho: true },
      { key: "subtitulo", label: "Entradilla", tipo: "parrafo", ancho: true },
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
    }))
    .filter((i) => i.titulo || i.texto)
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
