import { getVehiclesCached } from "@/lib/despiece";
import DepartamentosBar from "./DepartamentosBar";
import MiVehiculoBar from "@/components/despiece/MiVehiculoBar";

// Barras que acompañan a la cabecera en todas las páginas. En la portada se
// pintan después del carrusel; en el resto, justo antes del contenido.
export default async function StoreBars() {
  const vehicles = await getVehiclesCached().catch(() => []);
  return (
    <>
      <DepartamentosBar />
      <MiVehiculoBar vehicles={vehicles.map((v) => ({ slug: v.slug, brand: v.brand, model: v.model, version: v.version }))} />
    </>
  );
}
