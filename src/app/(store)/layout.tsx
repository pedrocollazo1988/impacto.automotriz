import { CartProvider } from "@/components/CartProvider";
import { VehicleProvider } from "@/components/VehicleProvider";
import MiVehiculoBar from "@/components/despiece/MiVehiculoBar";
import { getVehiclesCached } from "@/lib/despiece";
import PwaRegister from "@/components/PwaRegister";
import Analytics from "@/components/Analytics";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppFab from "@/components/site/WhatsAppFab";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const vehicles = await getVehiclesCached().catch(() => []);
  return (
    <VehicleProvider>
    <CartProvider>
      <PwaRegister />
      <Analytics />
      <SiteHeader />
      <MiVehiculoBar vehicles={vehicles.map((v) => ({ slug: v.slug, brand: v.brand, model: v.model, version: v.version }))} />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
      <WhatsAppFab />
    </CartProvider>
    </VehicleProvider>
  );
}
