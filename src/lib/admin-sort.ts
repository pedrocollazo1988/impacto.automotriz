// Búsqueda y orden del listado del panel. Sin dependencias para poder probarlos
// con datos planos, sin base de datos ni React.

export type FilaProducto = {
  id: number;
  sku: string;
  name: string;
  category: string;
  priceUsd: number;
  stock: number;
  lowStockAt: number;
};

export type ClaveOrden = "sku" | "name" | "category" | "priceUsd" | "stock";
export type Direccion = "asc" | "desc";

// Sin acentos ni mayúsculas: "Filtro Ñandú" se encuentra escribiendo "nandu".
export function normalizar(texto: string): string {
  return texto.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().trim();
}

export function filtrarProductos(filas: FilaProducto[], consulta: string): FilaProducto[] {
  const q = normalizar(consulta);
  if (!q) return filas;
  return filas.filter((f) => normalizar(f.name).includes(q));
}

export function ordenarProductos(filas: FilaProducto[], clave: ClaveOrden, direccion: Direccion): FilaProducto[] {
  const signo = direccion === "asc" ? 1 : -1;
  // La clave se normaliza una vez por fila, no dos veces por comparación:
  // con catálogos grandes eso era O(n log n) pasadas de NFD por cada tecla.
  const conClave = filas.map((f) => ({
    f,
    valor: f[clave],
    texto: typeof f[clave] === "number" ? "" : normalizar(String(f[clave])),
  }));
  conClave.sort((a, b) => {
    const r = typeof a.valor === "number" && typeof b.valor === "number"
      ? a.valor - b.valor
      : a.texto.localeCompare(b.texto, "es");
    // Desempate por id: sin él dos productos con el mismo valor cambian de
    // sitio entre renders y la tabla "baila" al ordenar.
    return r === 0 ? a.f.id - b.f.id : r * signo;
  });
  return conClave.map((x) => x.f);
}
