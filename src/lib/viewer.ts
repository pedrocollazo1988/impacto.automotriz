// Modos de presentación de la ficha. Compartido por el panel, la API y la tienda
// para que un valor inválido nunca llegue a la base.
export const VISTAS = ["photos", "model3d", "spin360"] as const;
export type Vista = (typeof VISTAS)[number];

export const esVista = (v: unknown): v is Vista => VISTAS.includes(v as Vista);

export const ETIQUETA_VISTA: Record<Vista, string> = {
  photos: "Galería de fotos",
  model3d: "Visor 3D",
  spin360: "Giro 360",
};
