import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";
import { SITE, SERVICIOS, NAV_EMPRESA, telefono, waHref } from "@/lib/site";

const TIENDA: [string, string][] = [
  ["/catalogo", "Catálogo completo"],
  ["/ofertas", "Ofertas"],
  ["/marcas-y-modelos", "Marcas y modelos"],
  ["/despiece", "Despiece interactivo"],
  ["/comparar", "Comparador"],
];

const AYUDA: [string, string][] = [
  ["/rastrear-pedido", "Rastrear mi pedido"],
  ["/garantia", "Reclamar garantía"],
  ["/preguntas-frecuentes", "Preguntas frecuentes"],
  ["/politicas/envios", "Envíos y entrega"],
  ["/politicas/devoluciones", "Devoluciones y garantía"],
  ["/contacto", "Contacto"],
];

export default function SiteFooter() {
  return (
    <footer className="mt-20 bg-[#0b1220] text-white/75">
      {/* Contacto destacado, como la franja de atención de MCV */}
      <div className="border-b border-white/10">
        <div className="container-x grid gap-6 py-8 sm:grid-cols-3">
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/20 text-[color:var(--color-action-hi)]"><Icon name="clock" size={19} /></span>
            <div>
              <p className="font-display text-sm font-bold text-white">Horario de atención</p>
              <p className="mt-1 text-sm text-white/65">{SITE.horario}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/20 text-[color:var(--color-action-hi)]"><Icon name="phone" size={19} /></span>
            <div>
              <p className="font-display text-sm font-bold text-white">Consultas</p>
              {telefono ? (
                <a href={`tel:${telefono.replace(/\s/g, "")}`} className="mt-1 flex min-h-11 items-center text-sm text-white/65 transition hover:text-white">{telefono}</a>
              ) : null}
              <a href={`mailto:${SITE.email}`} className="flex min-h-11 items-center text-sm text-white/65 transition hover:text-white">{SITE.email}</a>
            </div>
          </div>
          <div className="flex gap-3">
            <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/20 text-[color:var(--color-action-hi)]"><Icon name="pin" size={19} /></span>
            <div>
              <p className="font-display text-sm font-bold text-white">Dónde estamos</p>
              <p className="mt-1 text-sm text-white/65">{SITE.direccion}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="container-x grid gap-10 py-12 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo variant="light" size="md" href="/" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Piezas, accesorios y medios de transporte eléctrico. Compra en línea con entrega en toda Cuba,
            atención directa por WhatsApp.
          </p>
          <div className="mt-5 flex gap-2">
            <a href={waHref()} target="_blank" rel="noopener" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="whatsapp" size={20} /></a>
            <a href="#" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="instagram" size={20} /></a>
            <a href="#" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="facebook" size={20} /></a>
          </div>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Tienda</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {TIENDA.map(([h, l]) => <li key={h}><Link href={h} className="text-white/70 transition hover:text-[color:var(--color-action-hi)]">{l}</Link></li>)}
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Servicios</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {SERVICIOS.map((s) => <li key={s.href}><Link href={s.href} className="text-white/70 transition hover:text-[color:var(--color-action-hi)]">{s.label}</Link></li>)}
          </ul>
        </div>

        <div>
          <h2 className="font-mono text-[11px] font-bold uppercase tracking-[0.18em] text-white/50">Ayuda</h2>
          <ul className="mt-4 space-y-2.5 text-sm">
            {AYUDA.map(([h, l]) => <li key={h}><Link href={h} className="text-white/70 transition hover:text-[color:var(--color-action-hi)]">{l}</Link></li>)}
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/55 sm:flex-row">
          <p>© {new Date().getFullYear()} {SITE.razonSocial} Todos los derechos reservados.</p>
          <nav className="flex flex-wrap items-center gap-4">
            {NAV_EMPRESA.map((l) => <Link key={l.href} href={l.href} className="transition hover:text-white">{l.label}</Link>)}
            <span className="flex items-center gap-2"><Icon name="shield" size={14} /> Pago seguro</span>
          </nav>
        </div>
      </div>
    </footer>
  );
}
