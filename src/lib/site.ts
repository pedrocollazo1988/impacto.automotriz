// Datos de contacto y navegación del sitio, en un solo lugar para que
// cabecera, pie y páginas nuevas no se contradigan.

export const SITE = {
  nombre: "Impacto Automotriz",
  razonSocial: "Impacto Automotriz S.U.R.L.",
  direccion: "Calle 29 No. 5408 e/ 54 y 56, Artemisa, Cuba",
  email: "ventas@impactoautomotriz.cu",
  horario: "Lunes a viernes de 8:30 a 16:30",
} as const;

/** Número de WhatsApp de atención, en formato internacional sin signos. */
export const WHATSAPP = "5354099988";
export const telefono = "+53 5 4099988";

/** Enlace a WhatsApp con un mensaje opcional ya escrito. */
export const waHref = (texto?: string) =>
  `https://wa.me/${WHATSAPP}${texto ? `?text=${encodeURIComponent(texto)}` : ""}`;

export type Enlace = { href: string; label: string; descripcion?: string };

/** Menú principal, con la agrupación de MCV: tienda, empresa y servicios. */
export const NAV_PRINCIPAL: Enlace[] = [
  { href: "/catalogo", label: "Catálogo" },
  { href: "/ofertas", label: "Ofertas" },
  { href: "/marcas-y-modelos", label: "Marcas y modelos" },
  { href: "/despiece", label: "Despiece" },
  { href: "/novedades", label: "Novedades" },
  { href: "/contacto", label: "Contacto" },
];

/** Servicios, como la columna "Nuestros servicios" de MCV. */
export const SERVICIOS: Enlace[] = [
  { href: "/renta", label: "Renta y leasing", descripcion: "Flotas y vehículos eléctricos por temporada, con mantenimiento incluido." },
  { href: "/transportacion-de-carga", label: "Transportación de carga", descripcion: "Traslado de mercancía, piezas y equipos con seguimiento." },
  { href: "/servicios", label: "Postventa", descripcion: "Mantenimiento, diagnóstico y reparación con repuestos originales." },
  { href: "/catalogo", label: "Recambio vehicular", descripcion: "Partes, piezas y accesorios con compatibilidad por vehículo." },
  { href: "/servicios", label: "Asesoría técnica", descripcion: "Te decimos qué pieza necesitas antes de comprarla." },
];

/** Enlaces de la franja superior y del pie. */
export const NAV_EMPRESA: Enlace[] = [
  { href: "/nosotros", label: "Nosotros" },
  { href: "/novedades", label: "Novedades" },
  { href: "/testimonios", label: "Testimonios" },
  { href: "/preguntas-frecuentes", label: "Preguntas frecuentes" },
];
