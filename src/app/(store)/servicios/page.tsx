import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { SERVICIOS, SITE } from "@/lib/site";

export const metadata = { title: "Servicios" };

const POSTVENTA: [string, string, string][] = [
  ["wrench", "Mantenimiento preventivo", "Revisión por kilometraje, cambio de filtros, líquidos y frenos con repuestos del catálogo."],
  ["gauge", "Diagnóstico y reparación", "Localizamos la avería y te decimos qué pieza hace falta antes de tocar nada."],
  ["battery", "Sistemas eléctricos", "Baterías, cargadores y motor de vehículos eléctricos y triciclos."],
  ["shield", "Garantía de piezas", "Cada repuesto que vendemos está respaldado; si falla, lo revisamos."],
];

export default function Servicios() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-16">
          <span className="eyebrow eyebrow-light">Qué hacemos</span>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight">Servicios</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Además de vender piezas, te acompañamos después: mantenimiento, diagnóstico,
            reparación y asesoría para tu vehículo o tu flota.
          </p>
        </div>
      </section>

      <section className="container-x py-14">
        <div className="grid gap-4 sm:grid-cols-2">
          {POSTVENTA.map(([ic, t, d]) => (
            <div key={t} className="card flex gap-4 p-5">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name={ic} size={22} /></span>
              <div>
                <h2 className="font-display font-bold text-navy">{t}</h2>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{d}</p>
              </div>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-16">
        <h2 className="font-display text-2xl font-extrabold text-navy">Nuestras líneas de trabajo</h2>
        <div className="mt-6 grid gap-3 sm:grid-cols-2">
          {SERVICIOS.map((s) => (
            <Link key={s.href} href={s.href} className="card card-hover group flex items-center justify-between gap-4 p-5">
              <span>
                <span className="block font-display font-bold text-navy">{s.label}</span>
                <span className="mt-0.5 block text-sm text-slate-500">{s.descripcion}</span>
              </span>
              <Icon name="arrowRight" size={18} className="shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[color:var(--color-action)]" />
            </Link>
          ))}
        </div>
        <p className="mt-8 text-sm text-slate-500">
          ¿Tienes una consulta concreta? Escríbenos a{" "}
          <a href={`mailto:${SITE.email}`} className="link-underline font-semibold text-navy">{SITE.email}</a>.
        </p>
      </section>
    </div>
  );
}
