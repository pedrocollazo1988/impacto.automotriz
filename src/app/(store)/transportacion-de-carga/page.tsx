import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { SITE, telefono, waHref } from "@/lib/site";
import { leerSeccion } from "@/lib/contenido-server";

export const metadata = {
  title: "Transportación de carga",
  description: "Traslado de mercancía, piezas y equipos con seguimiento y entrega coordinada en toda Cuba.",
};

const PASOS = [
  ["info", "Cuéntanos la carga", "Origen, destino, peso aproximado y fecha en que la necesitas mover."],
  ["check", "Te damos la propuesta", "Elegimos el vehículo adecuado y te confirmamos el costo y el plazo."],
  ["truck", "Coordinamos la entrega", "Recogemos, trasladamos y avisamos cuando la carga llega a su destino."],
] as const;

export default async function TransportacionDeCarga() {
  const [hero, servicios, cierre] = await Promise.all([
    leerSeccion("carga-hero"),
    leerSeccion("carga-servicios"),
    leerSeccion("carga-cta"),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[color:var(--color-action)]/20 blur-3xl" />
        <div className="container-x relative py-16">
          <span className="eyebrow eyebrow-light">{hero.eyebrow}</span>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight">{hero.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contacto" className="btn btn-accent text-base">Solicitar una cotización</Link>
            {telefono && (
              <a href={waHref("Hola, necesito transportar una carga.")} target="_blank" rel="noopener" className="btn btn-outline-light text-base">
                <Icon name="whatsapp" size={18} /> Hablar por WhatsApp
              </a>
            )}
          </div>
        </div>
      </section>

      {servicios.visible && (
        <section className="container-x py-14">
          <h2 className="font-display text-2xl font-extrabold text-navy">{servicios.title}</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-3">
            {servicios.items.map((it) => (
              <div key={it.titulo} className="card p-6">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]">
                  <Icon name={it.icono || "box"} size={22} />
                </span>
                <h3 className="mt-4 font-display text-lg font-bold text-navy">{it.titulo}</h3>
                <p className="mt-1 text-sm leading-relaxed text-slate-500">{it.texto}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      <section className="container-x pb-14">
        <div className="card relative overflow-hidden p-8 sm:p-10">
          <div aria-hidden className="absolute inset-0 blueprint-dark" />
          <div className="relative">
            <h2 className="font-display text-2xl font-extrabold text-navy">Cómo funciona</h2>
            <ol className="mt-6 grid gap-5 sm:grid-cols-3">
              {PASOS.map(([icono, titulo, texto], i) => (
                <li key={titulo} className="flex gap-3">
                  <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-action)]/10 font-display text-sm font-extrabold text-[color:var(--color-action)]">{i + 1}</span>
                  <div>
                    <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-navy"><Icon name={icono} size={16} /> {titulo}</h3>
                    <p className="mt-1 text-sm leading-relaxed text-slate-500">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
            <p className="mt-6 text-sm text-slate-500">
              ¿Tienes una consulta concreta? Escríbenos a{" "}
              <a href={`mailto:${SITE.email}`} className="link-underline font-semibold text-navy">{SITE.email}</a>.
            </p>
          </div>
        </div>
      </section>

      {cierre.visible && (
        <section className="container-x pb-16">
          <div className="rounded-[1.75rem] bg-gradient-to-br from-[color:var(--color-navy)] to-[color:var(--color-navy-deep)] p-8 text-white sm:p-10">
            <h2 className="font-display text-2xl font-extrabold sm:text-3xl">{cierre.title}</h2>
            <p className="mt-3 max-w-2xl text-white/75">{cierre.subtitle}</p>
            <div className="mt-6 flex flex-wrap gap-3">
              {cierre.items.map((it) => (
                <Link key={it.titulo} href={it.href || "/contacto"} className="btn btn-outline-light">{it.titulo}</Link>
              ))}
              {telefono && (
                <a href={waHref("Hola, necesito transportar una carga.")} target="_blank" rel="noopener" className="btn btn-accent">
                  <Icon name="whatsapp" size={18} /> WhatsApp
                </a>
              )}
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
