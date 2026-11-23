export const MAX_CANTIDAD = 99;

/** Cantidad que se puede guardar: nunca supera el stock ni el máximo del carrito. */
export function cantidadPermitida(cantidad: number, stock: number): number {
  const tope = Math.max(0, Math.min(MAX_CANTIDAD, Math.floor(stock)));
  return Math.max(0, Math.min(tope, Math.floor(cantidad)));
}
