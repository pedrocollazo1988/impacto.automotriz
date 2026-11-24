import { CartProvider } from "@/components/CartProvider";
import { VehicleProvider } from "@/components/VehicleProvider";
import MiVehiculoBar from "@/components/despiece/MiVehiculoBar";
import { getVehiclesCached } from "@/lib/despiece";
import { leerSeccion } from "@/lib/contenido-server";
import PwaRegister from "@/components/PwaRegister";
import Analytics from "@/components/Analytics";
import SiteHeader from "@/components/site/SiteHeader";
import DepartamentosBar from "@/components/site/DepartamentosBar";
import SiteFooter from "@/components/site/SiteFooter";
import ActionRail from "@/components/site/ActionRail";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [vehicles, carrito] = await Promise.all([
    getVehiclesCached().catch(() => []),
    leerSeccion("carrito-config").catch(() => null),
  ]);
  const horas = Number(carrito?.items.find((i) => i.titulo?.toLowerCase().includes("horas"))?.texto) || 24;
  const aviso = carrito?.items.find((i) => i.titulo?.toLowerCase().includes("aviso"))?.texto ?? null;
  return (
    <VehicleProvider>
    <CartProvider ttlHoras={horas} aviso={aviso}>
      <PwaRegister />
      <Analytics />
      <SiteHeader />
      <DepartamentosBar />
      <MiVehiculoBar vehicles={vehicles.map((v) => ({ slug: v.slug, brand: v.brand, model: v.model, version: v.version }))} />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
      <ActionRail />
    </CartProvider>
    </VehicleProvider>
  );
}
