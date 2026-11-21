// Cuenta de fotogramas al arrastrar el visor 360.
//
// Se guarda el ultimo puntero y el resto sin consumir. Lo importante es medir
// contra la posicion ANTERIOR, no contra el punto de partida: si se mide contra
// el inicio, el desplazamiento se acumula y un arrastre corto avanza decenas de
// fotogramas, asi que el giro se dispara y parece roto.

export const PX_POR_FOTOGRAMA = 10;

export type EstadoArrastre = { ultimo: number; resto: number };

export function iniciarArrastre(x: number): EstadoArrastre {
  return { ultimo: x, resto: 0 };
}

/** Devuelve los fotogramas que toca avanzar (puede ser negativo) y el estado nuevo. */
export function pasosDeArrastre(estado: EstadoArrastre, x: number): { pasos: number; estado: EstadoArrastre } {
  const resto = estado.resto + (x - estado.ultimo);
  const pasos = Math.trunc(resto / PX_POR_FOTOGRAMA);
  return { pasos, estado: { ultimo: x, resto: pasos ? resto - pasos * PX_POR_FOTOGRAMA : resto } };
}

/** Indice dentro de la secuencia, dando la vuelta en los dos sentidos. */
export function envolver(indice: number, total: number): number {
  if (!total) return 0;
  return ((indice % total) + total) % total;
}
