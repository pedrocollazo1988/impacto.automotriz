import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { SITE, telefono } from "@/lib/site";

export const metadata = { title: "Renta y leasing" };

const PLANES: [string, string, string, string[]][] = [
  ["truck", "Renta por temporada", "Desde 1 semana", ["Vehículo eléctrico o utilitario", "Mantenimiento y seguro incluidos", "Entrega en Artemisa o La Habana", "Sustitución si hay avería"]],
  ["card", "Leasing operativo", "Desde 12 meses", ["Cuota mensual fija", "Sin desembolso inicial grande", "Servicio técnico en nuestra red", "Opción de compra al finalizar"]],
  ["battery", "Flota eléctrica", "A medida", ["Estudio de rutas y autonomía", "Cargadores y formación", "Mantenimiento preventivo", "Informe mensual de uso"]],
];

export default function Renta() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-16">
          <span className="eyebrow eyebrow-light">Servicios</span>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight">Renta y leasing de vehículos</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Accede a un vehículo sin comprarlo. Te damos la unidad, el mantenimiento y el seguro,
            y tú te quedas con la operación.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contacto" className="btn btn-accent text-base">Pedir una propuesta</Link>
            {telefono && <a href={`https://wa.me/${telefono.replace(/\D/g, "")}`} target="_blank" rel="noopener" className="btn btn-outline-light text-base"><Icon name="whatsapp" size={18} /> Hablar por WhatsApp</a>}
          </div>
        </div>
      </section>

      <section className="container-x py-14">
        <h2 className="font-display text-2xl font-extrabold text-navy">Modalidades</h2>
        <div className="mt-6 grid gap-4 lg:grid-cols-3">
          {PLANES.map(([ic, t, plazo, puntos]) => (
            <div key={t} className="card flex flex-col p-6">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-accent-deep)]"><Icon name={ic} size={22} /></span>
              <h3 className="mt-4 font-display text-lg font-bold text-navy">{t}</h3>
              <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{plazo}</p>
              <ul className="mt-4 space-y-2 text-sm text-slate-600">
                {puntos.map((p) => (
                  <li key={p} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-[color:var(--color-ok)]" />{p}</li>
                ))}
              </ul>
              <Link href="/contacto" className="btn btn-ghost mt-6 w-full">Solicitar información</Link>
            </div>
          ))}
        </div>
      </section>

      <section className="container-x pb-16">
        <div className="card relative overflow-hidden p-8 sm:p-10">
          <div aria-hidden className="absolute inset-0 blueprint-dark" />
          <div className="relative max-w-2xl">
            <h2 className="font-display text-2xl font-extrabold text-navy">¿Necesitas una flota para tu empresa?</h2>
            <p className="mt-3 text-slate-500">
              Calculamos la cuota según los kilómetros previstos, el número de unidades y el plazo.
              Escríbenos a {SITE.email} con esos datos y te preparamos la propuesta.
            </p>
            <Link href="/contacto" className="btn btn-primary mt-6">Contactar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
