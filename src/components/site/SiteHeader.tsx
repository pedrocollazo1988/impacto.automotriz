"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";
import { useCart } from "@/components/CartProvider";

const NAV: [string, string][] = [
  ["/catalogo", "Catálogo"],
  ["/ofertas", "Ofertas"],
  ["/despiece", "Despiece"],
  ["/catalogo?vehiculo=1", "Buscar por vehículo"],
  ["/nosotros", "Nosotros"],
  ["/contacto", "Contacto"],
];

export default function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const { count } = useCart();
  const path = usePathname();

  useEffect(() => setOpen(false), [path]);
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <header className={`sticky top-0 z-40 transition-all duration-300 ${scrolled ? "border-b border-slate-200/80 bg-white/90 shadow-[0_10px_30px_-24px_rgba(6,24,51,.6)] backdrop-blur-md" : "bg-white/70 backdrop-blur"}`}>
      <div className="container-x flex items-center gap-2 py-3 sm:gap-5">
        <Logo size="sm" tagline={false} className="min-w-0" />

        <form action="/catalogo" className="relative hidden flex-1 md:block">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input
            name="q"
            placeholder="Busca por nombre, código o referencia…"
            aria-label="Buscar productos"
            className="input h-11 pl-10 pr-24"
          />
          <button className="btn btn-primary absolute right-1.5 top-1/2 h-8 -translate-y-1/2 px-3 text-xs">Buscar</button>
        </form>

        <nav className="ml-auto hidden items-center gap-1 lg:flex">
          {NAV.map(([h, l]) => (
            <Link key={h} href={h} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 hover:text-navy">
              {l}
            </Link>
          ))}
        </nav>

        <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
          <Link href="/cuenta" aria-label="Mi cuenta" className="hidden h-11 w-11 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-navy sm:grid">
            <Icon name="user" size={20} />
          </Link>
          <Link href="/carrito" aria-label="Carrito" className="relative grid h-11 w-11 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-navy">
            <Icon name="cart" size={20} />
            {count > 0 && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--color-accent)] px-1 text-[11px] font-bold text-white">{count}</span>}
          </Link>
          <button onClick={() => setOpen((v) => !v)} aria-label="Abrir menú" aria-expanded={open} className="grid h-11 w-11 place-items-center rounded-xl text-navy transition hover:bg-slate-100 lg:hidden">
            <Icon name={open ? "close" : "menu"} size={22} />
          </button>
        </div>
      </div>

      {/* Buscador móvil */}
      <form action="/catalogo" className="container-x pb-3 md:hidden">
        <div className="relative">
          <Icon name="search" className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input name="q" placeholder="Buscar piezas…" aria-label="Buscar productos" className="input h-11 pl-10" />
        </div>
      </form>

      {/* Menú móvil */}
      <div className={`overflow-hidden border-t border-slate-200/70 bg-white transition-[max-height,opacity] duration-300 lg:hidden ${open ? "max-h-96 opacity-100" : "max-h-0 opacity-0"}`}>
        <nav className="container-x flex flex-col py-2">
          {[...NAV, ["/cuenta", "Mi cuenta"] as [string, string]].map(([h, l]) => (
            <Link key={h} href={h} className="flex items-center justify-between rounded-lg px-2 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy">
              {l}<Icon name="chevronRight" size={16} className="text-slate-400" />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
