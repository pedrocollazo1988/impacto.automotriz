"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";
import { useCart } from "@/components/CartProvider";
import { NAV_PRINCIPAL, NAV_EMPRESA, SITE, telefono } from "@/lib/site";

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
    <header className="sticky top-0 z-40">
      {/* Barra de utilidad: se recoge al bajar para dejar sitio al contenido.
          En la portada no se muestra, para que el logo quede arriba del todo. */}
      {path !== "/" && (
        <div
          className={`hidden overflow-hidden bg-[color:var(--color-navy-deep)] text-white/75 transition-[max-height,opacity] duration-300 lg:block ${scrolled ? "max-h-0 opacity-0" : "max-h-9 opacity-100"}`}
        >
          <div className="container-x flex h-9 items-center justify-between gap-4 text-xs">
            <p className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Icon name="clock" size={13} /> {SITE.horario}</span>
              {telefono && (
                <a href={`tel:${telefono.replace(/\s/g, "")}`} className="flex items-center gap-1.5 transition hover:text-white">
                  <Icon name="phone" size={13} /> {telefono}
                </a>
              )}
              <a href={`mailto:${SITE.email}`} className="flex items-center gap-1.5 transition hover:text-white">
                <Icon name="mail" size={13} /> {SITE.email}
              </a>
            </p>
            <nav className="flex items-center gap-4">
              {NAV_EMPRESA.map((l) => (
                <Link key={l.href} href={l.href} className="transition hover:text-white">{l.label}</Link>
              ))}
              <Link href="/cuenta" className="flex items-center gap-1.5 font-semibold text-white transition hover:text-[color:var(--color-action-hi)]">
                <Icon name="user" size={13} /> Mi cuenta
              </Link>
            </nav>
          </div>
        </div>
      )}

      {/* Barra principal: logo, buscador y acciones */}
      <div className={`border-b border-slate-200/80 transition-all duration-300 ${scrolled ? "bg-white/95 shadow-[0_10px_30px_-24px_rgba(6,24,51,.6)] backdrop-blur-md" : "bg-white"}`}>
        <div className="container-x flex items-center gap-2 py-3 sm:gap-5">
          <Logo size="sm" tagline={false} className="min-w-0" />

          <form action="/catalogo" role="search" className="relative hidden flex-1 md:block">
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              name="q"
              placeholder="Busca por nombre, código o referencia…"
              aria-label="Buscar productos"
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-28 text-sm outline-none transition focus:border-[color:var(--color-action)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-action)]/15"
            />
            <button className="btn btn-accent absolute right-1 top-1/2 h-9 -translate-y-1/2 rounded-full px-4 text-xs">Buscar</button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
            <Link href="/comparar" aria-label="Comparar" className="hidden h-12 w-12 place-items-center rounded-xl text-slate-700 lg:h-11 lg:w-11 transition hover:bg-slate-100 hover:text-navy sm:grid">
              <Icon name="compare" size={20} />
            </Link>
            <Link href="/carrito" aria-label="Carrito" title="Carrito" className="relative grid h-12 w-12 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-navy lg:h-11 lg:w-11">
              <Icon name="cart" size={20} />
              {count > 0 && <span className="absolute right-1 top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--color-action)] px-1 text-[11px] font-bold text-white ring-2 ring-white">{count}</span>}
            </Link>
            <Link href="/cuenta#deseos" aria-label="Lista de deseos" title="Lista de deseos" className="grid h-12 w-12 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-[color:var(--color-action)] lg:h-11 lg:w-11">
              <Icon name="heart" size={20} />
            </Link>
            <Link href="/cuenta" aria-label="Mi cuenta" title="Mi cuenta" className="grid h-12 w-12 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-navy lg:h-11 lg:w-11">
              <Icon name="user" size={20} />
            </Link>
            <button onClick={() => setOpen((v) => !v)} aria-label="Abrir menú" aria-expanded={open} className="grid h-12 w-12 place-items-center rounded-xl text-navy transition hover:bg-slate-100 lg:hidden">
              <Icon name={open ? "close" : "menu"} size={22} />
            </button>
          </div>
        </div>

        {/* Buscador móvil */}
        <form action="/catalogo" className="container-x pb-3 md:hidden">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input name="q" placeholder="Buscar piezas…" aria-label="Buscar productos" className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[color:var(--color-action)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-action)]/15" />
          </div>
        </form>
      </div>

      {/* Menú principal en escritorio */}
      <nav className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="container-x flex items-center gap-1">
          {NAV_PRINCIPAL.map((l) => {
            const activo = path === l.href || (l.href !== "/" && path.startsWith(l.href));
            return (
              <Link
                key={l.href}
                href={l.href}
                aria-current={activo ? "page" : undefined}
                className={`border-b-2 px-3 py-2.5 text-sm font-semibold transition ${
                  activo
                    ? "border-[color:var(--color-action)] text-[color:var(--color-action)]"
                    : "border-transparent text-slate-700 hover:border-[color:var(--color-action)]/40 hover:text-navy"
                }`}
              >
                {l.label}
              </Link>
            );
          })}
          <Link href="/renta" className="ml-auto flex items-center gap-1.5 py-2.5 text-sm font-bold text-[color:var(--color-action)] transition hover:text-navy">
            <Icon name="truck" size={16} /> Renta y leasing
          </Link>
        </div>
      </nav>

      {/* Menú móvil */}
      <div className={`overflow-y-auto border-t border-slate-200/70 bg-white transition-[max-height,opacity] duration-300 lg:hidden ${open ? "max-h-[calc(100vh-8rem)] opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}>
        <nav className="container-x flex flex-col py-2">
          {[...NAV_PRINCIPAL, ...NAV_EMPRESA, { href: "/renta", label: "Renta y leasing" }, { href: "/cuenta", label: "Mi cuenta" }].map((l) => (
            <Link key={l.href} href={l.href} className="flex min-h-12 items-center justify-between rounded-lg px-2 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy">
              {l.label}<Icon name="chevronRight" size={16} className="text-slate-400" />
            </Link>
          ))}
        </nav>
      </div>
    </header>
  );
}
