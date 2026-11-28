/** Estados de pedido en el orden en que avanza el proceso. */
export const ESTADOS_PEDIDO = ["PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELED"] as const;
export type EstadoPedido = (typeof ESTADOS_PEDIDO)[number];

export type PedidoFiltrable = { id: string; number: number; status: string; createdAt: Date | string };

export type FiltroPedidos = {
  estado: EstadoPedido | "TODOS";
  /** Solo los últimos N días; null = todo el historial. */
  desdeDias: number | null;
  texto: string;
};

export const FILTRO_VACIO: FiltroPedidos = { estado: "TODOS", desdeDias: null, texto: "" };

const fecha = (v: Date | string) => (v instanceof Date ? v : new Date(v));

/** Filtro de la lista de pedidos: estado, antigüedad y número (o parte de él). */
export function filtrarPedidos<T extends PedidoFiltrable>(lista: T[], f: FiltroPedidos, ahora: Date = new Date()): T[] {
  const texto = f.texto.replace(/[^\d]/g, "");
  const corte = f.desdeDias === null ? null : ahora.getTime() - f.desdeDias * 86_400_000;
  return lista.filter((p) => {
    if (f.estado !== "TODOS" && p.status !== f.estado) return false;
    if (texto && !String(p.number).includes(texto)) return false;
    if (corte !== null && fecha(p.createdAt).getTime() < corte) return false;
    return true;
  });
}

/** Cuántos hay de cada estado, más el total. Sirve para las pestañas. */
export function contarPorEstado(lista: PedidoFiltrable[]): Record<string, number> {
  const cuenta: Record<string, number> = { TODOS: lista.length };
  for (const e of ESTADOS_PEDIDO) cuenta[e] = 0;
  for (const p of lista) cuenta[p.status] = (cuenta[p.status] ?? 0) + 1;
  return cuenta;
}

/** Estados que se muestran como pestañas: solo los que tienen pedidos o son el
 *  filtro activo, para no llenar la barra de ceros. */
export function estadosVisibles(cuenta: Record<string, number>, activo: string): EstadoPedido[] {
  return ESTADOS_PEDIDO.filter((e) => (cuenta[e] ?? 0) > 0 || e === activo);
}
