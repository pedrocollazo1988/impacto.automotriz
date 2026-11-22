// Módulo puro: lo importan componentes de cliente y el servidor, así que no
// puede tocar prisma ni node:fs.

export const MAX_FOTOS = 5;
export const MAX_VIDEOS = 3;

export type Medio = { url: string; tipo: "foto" | "video" };

const VIDEO = /\.(mp4|webm)(\?|#|$)/i;

// El tipo se deduce de la URL, no de un campo aparte: las URLs vienen del panel y
// de la importación del catálogo, y así nunca se contradicen.
export const esVideo = (url: string) => VIDEO.test(url);

// Une fotos y vídeos en el orden en que se enseñan. Los vídeos van después de las
// fotos porque la primera foto es la imagen del catálogo y del resultado de Google.
export function mediosDeFicha(images: string[] = [], videos: string[] = []): Medio[] {
  return [
    ...images.filter(Boolean).map((url) => ({ url, tipo: "foto" as const })),
    ...videos.filter(Boolean).map((url) => ({ url, tipo: "video" as const })),
  ];
}

// Cuántos huecos quedan. El panel lo usa para desactivar el botón de subir en vez
// de aceptar archivos que luego se descartarían sin avisar.
export function huecosFotos(images: string[] = []) {
  return Math.max(0, MAX_FOTOS - images.length);
}
export function huecosVideos(videos: string[] = []) {
  return Math.max(0, MAX_VIDEOS - videos.length);
}

// Recorta a los límites conservando el orden. Se aplica al guardar, porque el
// formulario puede recibir más de golpe (arrastrar 12 fotos).
export function recortarMedios<T>(lista: T[], maximo: number): T[] {
  return lista.slice(0, maximo);
}

// El giro 360 necesita una secuencia; con una sola toma no hay nada que girar.
export const MIN_FOTOGRAMAS_360 = 8;
export const MAX_FOTOGRAMAS_360 = 72;

export function hayGiro360(frames: string[] = [], video?: string | null) {
  return !!video || frames.length >= MIN_FOTOGRAMAS_360;
}

// Un GLB de 25 MB tarda en descargarse; con una foto de portada el visitante ve
// algo mientras llega. Devuelve la mejor portada disponible.
export function portadaDe(images: string[] = [], videos: string[] = []): string | undefined {
  return images.find(Boolean) ?? undefined;
}
