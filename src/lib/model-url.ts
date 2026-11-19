import { SLUGS_MODELO } from "./model-slugs";

// Los .glb se generan en public/models con el SKU en minúsculas
// (scripts/generate-models.ts). La base de datos puede conservar rutas antiguas
// por slug o marcadores externos de ejemplo, que darían 404 o mostrarían un
// modelo ajeno al producto. Manda el SKU, y solo si su .glb existe de verdad.
const BLOB = /^https:\/\/[a-z0-9-]+\.public\.blob\.vercel-storage\.com\/.+\.glb$/i;

export function urlModelo(p: { sku?: string | null; model3dUrl?: string | null }): string | null {
  const guardada = p.model3dUrl?.trim();
  if (guardada && BLOB.test(guardada)) return guardada;
  const sku = p.sku?.trim().toLowerCase();
  if (!sku) return guardada || null;
  return SLUGS_MODELO.has(sku) ? `/models/${sku}.glb` : null;
}
