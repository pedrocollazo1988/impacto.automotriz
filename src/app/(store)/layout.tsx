import { CartProvider } from "@/components/CartProvider";
import PwaRegister from "@/components/PwaRegister";
import Analytics from "@/components/Analytics";
import SiteHeader from "@/components/site/SiteHeader";
import SiteFooter from "@/components/site/SiteFooter";
import WhatsAppFab from "@/components/site/WhatsAppFab";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  return (
    <CartProvider>
      <PwaRegister />
      <Analytics />
      <SiteHeader />
      <main className="min-h-[60vh]">{children}</main>
      <SiteFooter />
      <WhatsAppFab />
    </CartProvider>
  );
}
