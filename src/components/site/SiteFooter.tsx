import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";

const COLS: { title: string; links: [string, string][] }[] = [
  { title: "Tienda", links: [["/catalogo", "Catálogo completo"], ["/ofertas", "Ofertas"], ["/catalogo?vehiculo=1", "Buscar por vehículo"], ["/comparar", "Comparador"]] },
  { title: "Ayuda", links: [["/preguntas-frecuentes", "Preguntas frecuentes"], ["/politicas/envios", "Envíos y entrega"], ["/politicas/devoluciones", "Devoluciones y garantía"], ["/contacto", "Contacto"]] },
  { title: "Empresa", links: [["/nosotros", "Sobre nosotros"], ["/politicas/privacidad", "Privacidad"], ["/politicas/terminos", "Términos de uso"], ["/cuenta", "Mi cuenta"]] },
];

export default function SiteFooter() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  return (
    <footer className="mt-20 bg-[color:var(--color-navy-deep)] text-white/80">
      <div className="container-x grid gap-10 py-14 md:grid-cols-2 lg:grid-cols-5">
        <div className="lg:col-span-2">
          <Logo variant="light" size="md" href="/" />
          <p className="mt-5 max-w-sm text-sm leading-relaxed text-white/70">
            Piezas, accesorios y medios de transporte eléctrico. Compra en línea con entrega en toda Cuba,
            atención directa por WhatsApp.
          </p>
          <div className="mt-5 flex gap-2">
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" aria-label="WhatsApp" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="whatsapp" size={20} /></a>}
            <a href="#" aria-label="Instagram" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="instagram" size={20} /></a>
            <a href="#" aria-label="Facebook" className="grid h-10 w-10 place-items-center rounded-xl bg-white/10 transition hover:bg-white/20"><Icon name="facebook" size={20} /></a>
          </div>
        </div>
        {COLS.map((c) => (
          <div key={c.title}>
            <h3 className="font-display text-sm font-bold uppercase tracking-wider text-white">{c.title}</h3>
            <ul className="mt-4 space-y-2.5 text-sm">
              {c.links.map(([h, l]) => <li key={h}><Link href={h} className="text-white/70 transition hover:text-white">{l}</Link></li>)}
            </ul>
          </div>
        ))}
      </div>
      <div className="border-t border-white/10">
        <div className="container-x flex flex-col items-center justify-between gap-3 py-6 text-xs text-white/55 sm:flex-row">
          <p>© {new Date().getFullYear()} Impacto Automotriz S.U.R.L. Todos los derechos reservados.</p>
          <p className="flex items-center gap-2"><Icon name="shield" size={14} /> Pago seguro · Sitio protegido</p>
        </div>
      </div>
    </footer>
  );
}
