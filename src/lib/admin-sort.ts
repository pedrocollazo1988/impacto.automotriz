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
  return [...filas].sort((a, b) => {
    const va = a[clave];
    const vb = b[clave];
    const r =
      typeof va === "number" && typeof vb === "number"
        ? va - vb
        : normalizar(String(va)).localeCompare(normalizar(String(vb)), "es");
    // Desempate por id: sin él dos productos con el mismo valor cambian de
    // sitio entre renders y la tabla "baila" al ordenar.
    return r === 0 ? a.id - b.id : r * signo;
  });
}
