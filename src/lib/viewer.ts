// Módulo puro: lo importa un componente de cliente, así que no puede tocar prisma.
export const VISTAS = ["photos", "model3d", "spin360"] as const;
export type Vista = (typeof VISTAS)[number];

export const ETIQUETA_VISTA: Record<Vista, string> = {
  photos: "Galería de fotos",
  model3d: "Visor 3D",
  spin360: "Giro 360",
};

export const esVista = (v: unknown): v is Vista => typeof v === "string" && (VISTAS as readonly string[]).includes(v);
