
// La vista 360 solo tiene sentido en los vehículos eléctricos: triciclos, motos,
// bicicletas y patinetes. El resto del catálogo son repuestos y se queda con la foto.
export const CATEGORIAS_360 = new Set(["triciclos-electricos"]);

export const tieneVista360 = (categoriaSlug?: string | null) =>
  !!categoriaSlug && CATEGORIAS_360.has(categoriaSlug);
