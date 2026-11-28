// Módulo puro: lo importa un componente de cliente, así que no puede tocar prisma.
export const VISTAS = ["photos", "model3d", "spin360"] as const;
export type Vista = (typeof VISTAS)[number];

export const ETIQUETA_VISTA: Record<Vista, string> = {
  photos: "Galería de fotos",
  model3d: "Visor 3D",
  spin360: "Giro 360",
};

// Claves del diccionario para las pestañas de la ficha. El panel no usa el
// idioma del visitante, así que sigue leyendo ETIQUETA_VISTA.
export const CLAVE_VISTA: Record<Vista, string> = {
  photos: "gallery.tabPhotos",
  model3d: "gallery.tab3d",
  spin360: "gallery.tab360",
};

export const esVista = (v: unknown): v is Vista => typeof v === "string" && (VISTAS as readonly string[]).includes(v);
