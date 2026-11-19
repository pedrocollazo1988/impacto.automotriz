// Los .glb se generan en public/models con el SKU en minúsculas
// (scripts/generate-models.ts). La base de datos puede conservar rutas antiguas,
// por slug, de catálogos ya sembrados, y entonces el visor 3D daría 404.
// Una URL absoluta (Vercel Blob) se respeta y un producto sin modelo sigue sin él;
// solo se rederiva del SKU una ruta /models/... que ya existía.
export function urlModelo(p: { sku?: string | null; model3dUrl?: string | null }): string | null {
  const guardada = p.model3dUrl?.trim();
  if (!guardada) return null;
  if (!guardada.startsWith("/models/")) return guardada;
  const sku = p.sku?.trim().toLowerCase();
  return sku ? `/models/${sku}.glb` : guardada;
}
