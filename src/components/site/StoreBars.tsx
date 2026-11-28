import { getVehiclesCached } from "@/lib/despiece";
import DepartamentosBar from "./DepartamentosBar";
import MiVehiculoBar from "@/components/despiece/MiVehiculoBar";
import { versionVehiculo } from "@/lib/datos-i18n";
import { getLang } from "@/lib/i18n";

// Barras que acompañan a la cabecera en todas las páginas. En la portada se
// pintan después del carrusel; en el resto, justo antes del contenido.
export default async function StoreBars() {
  const [vehicles, lang] = await Promise.all([getVehiclesCached().catch(() => []), getLang()]);
  return (
    <>
      <DepartamentosBar />
      <MiVehiculoBar vehicles={vehicles.map((v) => ({ slug: v.slug, brand: v.brand, model: v.model, version: versionVehiculo(v, lang) }))} />
    </>
  );
}
