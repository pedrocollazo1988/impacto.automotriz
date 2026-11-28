import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";
import { SITE, SERVICIOS, telefono, waHref } from "@/lib/site";
import { getMenuEmpresa } from "@/lib/menu-server";
import { getT } from "@/lib/i18n";

const CLAVE_MENU: Record<string, string> = {
  "/catalogo": "nav.catalogo", "/ofertas": "nav.ofertas", "/marcas-y-modelos": "nav.marcas",
  "/despiece": "nav.despiece", "/blog": "nav.blog", "/novedades": "nav.novedades",
  "/contacto": "nav.contacto", "/nosotros": "nav.nosotros", "/testimonios": "nav.testimonios",
  "/preguntas-frecuentes": "nav.faq", "/renta": "nav.renta",
};

const TIENDA: [string, string][] = [
  ["/catalogo", "footer.shopAll"],
  ["/ofertas", "nav.ofertas"],
  ["/marcas-y-modelos", "nav.marcas"],
  ["/despiece", "footer.partsDiagram"],
  ["/comparar", "footer.compare"],
  ["/blog", "footer.brandBlog"],
];

const AYUDA: [string, string][] = [
  ["/rastrear-pedido", "footer.track"],
  ["/garantia", "footer.warranty"],
  ["/preguntas-frecuentes", "nav.faq"],
  ["/politicas/envios", "footer.shipping"],
  ["/politicas/devoluciones", "footer.returns"],
  ["/contacto", "nav.contacto"],
];

export default async function SiteFooter() {
  const [{ t, lang }, menuEmpresa] = await Promise.all([getT(), getMenuEmpresa().catch(() => [])]);
  const menuEmpresaUnico = Array.from(new Map(menuEmpresa.map((l) => [l.href, l])).values());
  return (
    <footer className="mt-12 bg-[#0b1220] text-white/75 print:hidden">
      {/* Contacto destacado, como la franja de atención de MCV */}
      <div className="border-b border-white/10">
        <div className="container-x grid gap-6 py-8 sm:grid-cols-3">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/20 text-[color:var(--color-action-hi)]"><Icon name="clock" size={19} /></span>
            <div>
              <p className="font-display text-sm font-bold text-white">{t("footer.hours")}</p>
              <p className="mt-1 text-sm text-white/65">{lang === "en" ? SITE.horarioEn : SITE.horario}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/20 text-[color:var(--color-action-hi)]"><Icon name="phone" size={19} /></span>
            <div>
              <p className="font-display text-sm font-bold text-white">{t("footer.questions")}</p>
              {telefono ? (
                <a href={`tel:${telefono.replace(/\s/g, "")}`} className="mt-1 flex min-h-11 items-center text-sm text-white/65 transition hover:text-white">{telefono}</a>
              ) : null}
              <a href={`mailto:${SITE.email}`} className="flex min-h-11 items-center text-sm text-white/65 transition hover:text-white">{SITE.email}</a>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/20 text-[color:var(--color-action-hi)]"><Icon name="pin" size={19} /></span>
            <div>
              <p className="font-display text-sm font-bold text-white">{t("footer.location")}</p>
              <p className="mt-1 text-sm text-white/65">{SITE.direccion}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo variant="light" size="md" href="/" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            {t("footer.about")}
          </p>
          <div className="mt-5 flex gap-2">
            <a href={waHref()} target="_blank" rel="noopener" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="whatsapp" size={20} /></a>
            <a href="#" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="instagram" size={20} /></a>
            <a href="#" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="facebook" size={20} /></a>
          </div>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">{t("footer.shop")}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {TIENDA.map(([h, c]) => <li key={h}><Link href={h} className="text-white/70 transition hover:text-[color:var(--color-action-hi)]">{t(c)}</Link></li>)}
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">{t("footer.services")}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SERVICIOS.map((s) => <li key={`${s.href}-${s.label}`}><Link href={s.href} className="text-white/70 transition hover:text-[color:var(--color-action-hi)]">{s.label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">{t("footer.help")}</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {AYUDA.map(([h, c]) => <li key={h}><Link href={h} className="text-white/70 transition hover:text-[color:var(--color-action-hi)]">{t(c)}</Link></li>)}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/55 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.razonSocial} {t("footer.rights")}</p>
          <nav className="flex flex-wrap items-center gap-4">
            {menuEmpresaUnico.map((l) => <Link key={l.href} href={l.href} className="transition hover:text-white">{CLAVE_MENU[l.href] ? t(CLAVE_MENU[l.href]) : l.label}</Link>)}
            <span className="flex items-center gap-2"><Icon name="shield" size={14} /> {t("footer.secure")}</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
