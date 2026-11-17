import Link from "next/link";
import Image from "next/image";
import { CartProvider } from "@/components/CartProvider";
import CartLink from "@/components/CartLink";
import PwaRegister from "@/components/PwaRegister";
import Analytics from "@/components/Analytics";

export default function StoreLayout({ children }: { children: React.ReactNode }) {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  return (
    <CartProvider>
      <PwaRegister /><Analytics />
      <header className="sticky top-0 z-20 border-b bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-6xl items-center gap-4 px-4 py-2">
          <Link href="/"><Image src="/logo.jpg" alt="Impacto Automotriz S.U.R.L." width={56} height={56} priority /></Link>
          <form action="/catalogo" className="flex-1"><input name="q" placeholder="Buscar por nombre, código o referencia…" className="w-full rounded-lg border px-3 py-2 text-sm" /></form>
          <nav className="flex items-center gap-4 text-sm font-medium text-navy"><Link href="/catalogo">Catálogo</Link><Link href="/cuenta">Mi cuenta</Link><CartLink /></nav>
        </div>
      </header>
      <main className="mx-auto max-w-6xl px-4 py-6">{children}</main>
      <footer className="mt-12 bg-navy py-8 text-center text-sm text-white/80">© Impacto Automotriz S.U.R.L.</footer>
      {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="fixed bottom-4 right-4 rounded-full bg-green-600 px-4 py-3 text-sm font-semibold text-white shadow-lg">WhatsApp</a>}
    </CartProvider>
  );
}
