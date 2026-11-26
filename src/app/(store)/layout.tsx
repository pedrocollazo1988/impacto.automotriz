import { CartProvider } from "@/components/CartProvider";
import { VehicleProvider } from "@/components/VehicleProvider";
import { leerSeccion } from "@/lib/contenido-server";
import PwaRegister from "@/components/PwaRegister";
import Analytics from "@/components/Analytics";
import SiteHeader from "@/components/site/SiteHeader";
import StoreBars from "@/components/site/StoreBars";
import StoreChrome from "@/components/site/StoreChrome";
import SiteFooter from "@/components/site/SiteFooter";
import ActionRail from "@/components/site/ActionRail";
import { getMenuEmpresa, getMenuPrincipal } from "@/lib/menu-server";

export default async function StoreLayout({ children }: { children: React.ReactNode }) {
  const [menuPrincipal, menuEmpresa] = await Promise.all([
    getMenuPrincipal().catch(() => []),
    getMenuEmpresa().catch(() => []),
  ]);
  const carrito = await leerSeccion("carrito-config").catch(() => null);
  const horas = Number(carrito?.items.find((i) => i.titulo?.toLowerCase().includes("horas"))?.texto) || 24;
  const aviso = carrito?.items.find((i) => i.titulo?.toLowerCase().includes("aviso"))?.texto ?? null;
  return (
    <VehicleProvider>
    <CartProvider ttlHoras={horas} aviso={aviso}>
      <PwaRegister />
      <Analytics />
      <SiteHeader navPrincipal={menuPrincipal} navEmpresa={menuEmpresa} />
      <StoreChrome bars={<StoreBars />}>
        <main className="min-h-[60vh]">{children}</main>
      </StoreChrome>
      <SiteFooter />
      <ActionRail />
    </CartProvider>
    </VehicleProvider>
  );
}
