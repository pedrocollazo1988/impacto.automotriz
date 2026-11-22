import Link from "next/link";
import Icon from "@/components/brand/Icon";
export const metadata = { title: "Sobre nosotros" };

const STATS: [string, string][] = [["+100", "productos en catálogo"], ["15", "provincias con entrega"], ["24/7", "tienda abierta"], ["100%", "pago seguro"]];
const VALUES: [string, string, string][] = [
  ["shield", "Piezas con garantía", "Trabajamos con proveedores seleccionados y respaldamos cada producto que vendemos."],
  ["car", "Asesoría real", "Te ayudamos a identificar la pieza correcta según la marca, modelo y año de tu vehículo."],
  ["bolt", "Movilidad eléctrica", "Impulsamos los medios de transporte eléctrico como solución eficiente y económica."],
  ["truck", "Entrega nacional", "Llegamos a toda Cuba con varias modalidades de entrega y seguimiento de tu pedido."],
];

export default function Nosotros() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-16">
          <span className="eyebrow eyebrow-light">Quiénes somos</span>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight">Impulsamos la movilidad de Cuba con piezas confiables</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">Impacto Automotriz S.U.R.L. es una tienda especializada en partes, piezas, accesorios automotrices y medios de transporte eléctrico. Nuestro objetivo es que encuentres la pieza correcta sin complicaciones, con información clara y entrega en todo el país.</p>
        </div>
      </section>
      <section className="container-x -mt-8 relative z-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {STATS.map(([n, l]) => <div key={l} className="card p-5 text-center"><p className="font-display text-3xl font-extrabold text-navy">{n}</p><p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{l}</p></div>)}
        </div>
      </section>
      <section className="container-x py-14">
        <h2 className="font-display text-2xl font-extrabold text-navy">Lo que nos distingue</h2>
        <div className="mt-6 grid gap-4 sm:grid-cols-2">
          {VALUES.map(([ic, t, d]) => (
            <div key={t} className="card flex gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name={ic} size={22} /></span>
              <div><h3 className="font-display font-bold text-navy">{t}</h3><p className="mt-1 text-sm leading-relaxed text-slate-500">{d}</p></div>
            </div>
          ))}
        </div>
      </section>
      <section className="container-x pb-4">
        <div className="card relative overflow-hidden p-8 text-center sm:p-12">
          <div aria-hidden className="absolute inset-0 blueprint-dark" />
          <div className="relative">
            <h2 className="font-display text-2xl font-extrabold text-navy">¿Listo para encontrar tu pieza?</h2>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/catalogo" className="btn btn-primary">Explorar catálogo</Link>
              <Link href="/contacto" className="btn btn-ghost">Hablar con nosotros</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
