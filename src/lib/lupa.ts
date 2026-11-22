// Módulo puro de la lupa. Vive aparte del componente para poder probar los
// topes y la velocidad sin navegador.

export const ZOOM_MIN = 1;
export const ZOOM_MAX = 4;
export const ZOOM_INICIAL = 2;

// Antes el zoom era fijo a 2,4x y seguía al cursor sin transición: al mover el
// ratón la imagen "saltaba" y marea. Ahora cada paso de rueda multiplica por un
// factor pequeño, así el cambio se percibe como continuo.
export const PASO_RUEDA = 1.12;
// Con el botón pulsado, un paso más decidido para no tener que girar 20 veces.
export const PASO_BOTON = 1.35;

export const acotar = (z: number) => Math.min(ZOOM_MAX, Math.max(ZOOM_MIN, z));

// deltaY negativo = rueda hacia arriba = acercar. Se normaliza el signo porque
// los navegadores no coinciden en la magnitud (un ratón da 100, un trackpad 3).
export function zoomConRueda(actual: number, deltaY: number): number {
  if (!Number.isFinite(deltaY) || deltaY === 0) return acotar(actual);
  return acotar(actual * (deltaY < 0 ? PASO_RUEDA : 1 / PASO_RUEDA));
}

export function zoomConBoton(actual: number, acercar: boolean): number {
  return acotar(actual * (acercar ? PASO_BOTON : 1 / PASO_BOTON));
}

// Posición del punto de interés en % del marco, recortada a los bordes. Se usa
// como transform-origin: sin recortar, mover el cursor fuera de la foto desplaza
// la imagen y deja huecos blancos.
export function origenEn(x: number, y: number, ancho: number, alto: number) {
  const pct = (v: number, total: number) => (total <= 0 ? 50 : Math.min(100, Math.max(0, (v / total) * 100)));
  return { x: pct(x, ancho), y: pct(y, alto) };
}

// Escalón de calidad que pide el navegador a Next. Ampliar una miniatura de 384 px
// a 4x la deja borrosa: con la lupa se pide la imagen a su tamaño natural.
export function anchoParaZoom(anchoVisibleCss: number, zoom: number, dpr = 1): number {
  const px = anchoVisibleCss * zoom * dpr;
  const escalones = [320, 360, 420, 480, 640, 768, 1024, 1280, 1920, 3840];
  return escalones.find((e) => e >= px) ?? 3840;
}
