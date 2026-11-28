"use client";
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";
import { useCart } from "@/components/CartProvider";
import { NAV_PRINCIPAL, NAV_EMPRESA, SITE, telefono, waHref, type Enlace } from "@/lib/site";
import { LanguageToggle, ThemeToggle, usePreferences } from "@/components/site/Preferences";
import UserMenu from "@/components/site/UserMenu";

const CLAVE_NAV: Record<string, string> = {
  "/catalogo": "nav.catalogo", "/ofertas": "nav.ofertas", "/marcas-y-modelos": "nav.marcas",
  "/despiece": "nav.despiece", "/blog": "nav.blog", "/blog#suscribirme": "nav.subscribe", "/novedades": "nav.novedades", "/contacto": "nav.contacto",
  "/nosotros": "nav.nosotros", "/testimonios": "nav.testimonios", "/preguntas-frecuentes": "nav.faq",
  "/renta": "nav.renta",
};

export default function SiteHeader({
  navPrincipal = NAV_PRINCIPAL,
  navEmpresa = NAV_EMPRESA,
}: {
  navPrincipal?: Enlace[];
  navEmpresa?: Enlace[];
} = {}) {
  const [open, setOpen] = useState(false);
  const [oculto, setOculto] = useState(false);
  const ultimoY = useRef(0);
  const { t, lang } = usePreferences();
  const tr = (href: string, label: string) => (CLAVE_NAV[href] ? t(CLAVE_NAV[href]) : label);
  const { count } = useCart();
  const path = usePathname();
  // Un mismo destino no debe aparecer dos veces en el menú móvil.
  const navMovil = Array.from(new Map([
    ...navPrincipal, ...navEmpresa,
    { href: "/renta", label: "Renta y leasing" },
    { href: "/cuenta", label: "Mi cuenta" },
  ].map((l) => [l.href, l] as const)).values());
  const navEmpresaUnico = Array.from(new Map(navEmpresa.map((l) => [l.href, l] as const)).values());
  const navPrincipalUnico = Array.from(new Map(navPrincipal.map((l) => [l.href, l] as const)).values());

  useEffect(() => setOpen(false), [path]);

  // En móvil la cabecera se va al bajar y vuelve al subir. En escritorio se
  // queda fija: allí no roba espacio y sirve de referencia constante.
  useEffect(() => {
    let pendiente = false;
    const alDesplazar = () => {
      if (pendiente) return;
      pendiente = true;
      requestAnimationFrame(() => {
        const y = window.scrollY;
        const delta = y - ultimoY.current;
        if (open || y < 80 || delta < -6) setOculto(false);
        else if (delta > 6) setOculto(true);
        ultimoY.current = y;
        pendiente = false;
      });
    };
    window.addEventListener("scroll", alDesplazar, { passive: true });
    return () => window.removeEventListener("scroll", alDesplazar);
  }, [open]);

  return (
    <header className={`sticky top-0 z-40 will-change-transform transition-transform duration-300 print:hidden ${oculto ? "-translate-y-full lg:translate-y-0" : "translate-y-0"}`}>
      {/* Barra de utilidad fija: si se ocultaba al bajar, el header cambiaba
          de alto y el contenido daba un salto. */}
      <div className="hidden bg-[color:var(--color-navy-deep)] text-white/75 lg:block">
          <div className="container-x flex h-9 items-center justify-between gap-4 text-xs">
            <p className="flex items-center gap-4">
              <span className="flex items-center gap-1.5"><Icon name="clock" size={13} /> {lang === "en" ? SITE.horarioEn : SITE.horario}</span>
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
              {navEmpresaUnico.filter((l) => l.href !== "/novedades").map((l) => (
                <Link key={l.href} href={l.href} className="transition hover:text-white">{tr(l.href, l.label)}</Link>
              ))}
              <ThemeToggle />
              <LanguageToggle />
              <Link href="/cuenta" className="flex items-center gap-1.5 font-semibold text-white transition hover:text-[color:var(--color-action-hi)]">
                <Icon name="user" size={13} /> {t("header.account")}
              </Link>
            </nav>
        </div>
      </div>

      {/* Barra principal: logo, buscador y acciones */}
      <div className="border-b border-slate-200/80 bg-white">
        <div className="container-x flex items-center gap-2 py-3 sm:gap-5">
          <Logo size="sm" tagline={false} className="min-w-0" />

          <form action="/catalogo" role="search" className="relative hidden flex-1 md:block">
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input
              name="q"
              placeholder={t("header.search")}
              aria-label={t("header.searchShort")}
              className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-28 text-sm outline-none transition focus:border-[color:var(--color-action)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-action)]/15"
            />
            <button className="btn btn-accent absolute right-1 top-1/2 h-9 -translate-y-1/2 rounded-full px-4 text-xs">{t("header.searchBtn")}</button>
          </form>

          <div className="ml-auto flex shrink-0 items-center gap-1 lg:ml-0">
            <Link href="/comparar" aria-label={t("header.compare")} className="hidden h-12 w-12 place-items-center rounded-xl text-slate-700 lg:h-11 lg:w-11 transition hover:bg-slate-100 hover:text-navy sm:grid">
              <Icon name="compare" size={20} />
            </Link>
            <Link href="/carrito" aria-label={t("header.cart")} title={t("header.cart")} className="relative grid h-10 w-10 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-navy sm:h-12 sm:w-12 lg:h-11 lg:w-11">
              <Icon name="cart" size={20} />
              {count > 0 && <span className="absolute -right-1 -top-1 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--color-action)] px-1 text-[11px] font-bold text-white ring-2 ring-white sm:right-1 sm:top-1">{count}</span>}
            </Link>
            <Link href="/cuenta#deseos" aria-label={t("header.wishlist")} title={t("header.wishlist")} className="hidden h-12 w-12 place-items-center rounded-xl text-slate-700 transition hover:bg-slate-100 hover:text-[color:var(--color-action)] sm:grid lg:h-11 lg:w-11">
              <Icon name="heart" size={20} />
            </Link>
            <UserMenu />
            <button onClick={() => setOpen((v) => !v)} aria-label={t("header.menu")} aria-expanded={open} className="grid h-10 w-10 place-items-center rounded-xl text-navy transition hover:bg-slate-100 sm:h-12 sm:w-12 lg:hidden">
              <Icon name={open ? "close" : "menu"} size={22} />
            </button>
          </div>
        </div>

        {/* Buscador móvil */}
        <form action="/catalogo" className="container-x pb-3 md:hidden">
          <div className="relative">
            <Icon name="search" className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
            <input name="q" placeholder={t("header.searchShort")} aria-label={t("header.searchShort")} className="h-11 w-full rounded-full border border-slate-200 bg-slate-50 pl-11 pr-4 text-sm outline-none transition focus:border-[color:var(--color-action)] focus:bg-white focus:ring-4 focus:ring-[color:var(--color-action)]/15" />
          </div>
        </form>
      </div>

      {/* Menú principal en escritorio */}
      <nav className="hidden border-b border-slate-200 bg-white lg:block">
        <div className="container-x flex items-center gap-1">
          {navPrincipalUnico.map((l) => {
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
                {tr(l.href, l.label)}
              </Link>
            );
          })}
          <Link href="/renta" className="ml-auto flex items-center gap-1.5 py-2.5 text-sm font-bold text-[color:var(--color-action)] transition hover:text-navy">
            <Icon name="truck" size={16} /> {t("nav.renta")}
          </Link>
        </div>
      </nav>

      {/* Menú móvil */}
      <div className={`overflow-y-auto border-t border-slate-200/70 bg-white transition-[max-height,opacity] duration-300 lg:hidden ${open ? "max-h-[calc(100vh-8rem)] opacity-100" : "max-h-0 overflow-hidden opacity-0"}`}>
        <div className="container-x flex items-center justify-between border-b border-slate-100 py-2 text-slate-700">
          <span className="text-xs font-semibold text-slate-500">Tema / Language</span>
          <div className="flex items-center gap-1"><ThemeToggle /><LanguageToggle /></div>
        </div>
        <nav className="container-x flex flex-col py-2">
          {navMovil.map((l) => (
            <Link key={l.href} href={l.href} className="flex min-h-12 items-center justify-between rounded-lg px-2 py-3 text-sm font-semibold text-slate-700 hover:bg-slate-50 hover:text-navy">
              {tr(l.href, l.label)}<Icon name="chevronRight" size={16} className="text-slate-400" />
            </Link>
          ))}
          <div className="mt-2 border-t border-slate-100 pt-2"><UserMenu variante="lista" /></div>
          <a href={waHref("Hola, quiero hacer una consulta sobre sus productos")} target="_blank" rel="noopener" className="mt-1 flex min-h-12 items-center gap-2 rounded-lg px-2 py-3 text-sm font-semibold text-emerald-700 hover:bg-emerald-50">
            <Icon name="whatsapp" size={18} /> Consultar por WhatsApp
          </a>
        </nav>
      </div>
    </header>
  );
}
