import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { SITE, telefono, waHref } from "@/lib/site";
import { leerSeccion } from "@/lib/contenido-server";

export const metadata = { title: "Renta y leasing" };

export default async function Renta() {
  const [hero, modalidades, cierre] = await Promise.all([
    leerSeccion("renta-hero"),
    leerSeccion("renta-modalidades"),
    leerSeccion("renta-cta"),
  ]);

  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-16">
          <span className="eyebrow eyebrow-light">{hero.eyebrow}</span>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight">{hero.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{hero.subtitle}</p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link href="/contacto" className="btn btn-accent text-base">Pedir una propuesta</Link>
            {hero.items.map((it) => (
              <Link key={it.titulo} href={it.href || "/contacto"} className="btn btn-outline-light text-base"><Icon name={it.icono || "arrowRight"} size={18} /> {it.titulo}</Link>
            ))}
            {telefono && <a href={waHref()} target="_blank" rel="noopener" className="btn btn-outline-light text-base"><Icon name="whatsapp" size={18} /> Hablar por WhatsApp</a>}
          </div>
        </div>
      </section>

      {modalidades.visible && (
        <section className="container-x py-14">
          <h2 className="font-display text-2xl font-extrabold text-navy">{modalidades.title}</h2>
          {modalidades.subtitle && <p className="mt-2 max-w-2xl text-sm text-slate-500">{modalidades.subtitle}</p>}
          <div className="mt-6 grid gap-4 lg:grid-cols-3">
            {modalidades.items.map((plan) => {
              const [plazo, ...puntos] = (plan.texto || "").split("\n");
              return (
                <div key={plan.titulo} className="card flex flex-col p-6">
                  <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name={plan.icono || "truck"} size={22} /></span>
                  <h3 className="mt-4 font-display text-lg font-bold text-navy">{plan.titulo}</h3>
                  {plazo && <p className="font-mono text-[11px] uppercase tracking-wider text-slate-500">{plazo}</p>}
                  <ul className="mt-4 space-y-2 text-sm text-slate-600">
                    {puntos.map((p) => (
                      <li key={p} className="flex gap-2"><Icon name="check" size={16} className="mt-0.5 shrink-0 text-[color:var(--color-ok)]" />{p}</li>
                    ))}
                  </ul>
                  <Link href={plan.href || "/contacto"} className="btn btn-ghost mt-6 w-full">Solicitar información</Link>
                </div>
              );
            })}
          </div>
        </section>
      )}

      {cierre.visible && (
        <section className="container-x pb-16">
          <div className="card relative overflow-hidden p-8 sm:p-10">
            <div aria-hidden className="absolute inset-0 blueprint-dark" />
            <div className="relative max-w-2xl">
              <h2 className="font-display text-2xl font-extrabold text-navy">{cierre.title}</h2>
              <p className="mt-3 text-slate-500">
                {cierre.subtitle} Escríbenos a{" "}
                <a href={`mailto:${SITE.email}`} className="link-underline font-semibold text-navy">{SITE.email}</a>.
              </p>
              <div className="mt-6 flex flex-wrap gap-3">
                {cierre.items.map((it) => (
                  <Link key={it.titulo} href={it.href || "/contacto"} className="btn btn-primary">{it.titulo}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
