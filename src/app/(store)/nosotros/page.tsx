import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { leerSeccion } from "@/lib/contenido-server";

export const metadata = { title: "Sobre nosotros" };

export default async function Nosotros() {
  const [valores, cifras, cierre] = await Promise.all([leerSeccion("nosotros-valores"), leerSeccion("nosotros-cifras"), leerSeccion("nosotros-cta")]);

  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-16">
          <span className="eyebrow eyebrow-light">{valores.eyebrow}</span>
          <h1 className="mt-2 max-w-3xl font-display text-4xl font-extrabold leading-tight">{valores.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{valores.subtitle}</p>
        </div>
      </section>

      {cifras.visible && (
        <section className="container-x -mt-8 relative z-10">
          <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
            {cifras.items.map((it) => (
              <div key={it.texto} className="card p-5 text-center">
                <p className="font-display text-3xl font-extrabold text-navy">{it.titulo}</p>
                <p className="mt-1 text-xs uppercase tracking-wider text-slate-500">{it.texto}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {valores.visible && (
        <section className="container-x py-14">
          <h2 className="font-display text-2xl font-extrabold text-navy">Lo que nos distingue</h2>
          <div className="mt-6 grid gap-4 sm:grid-cols-2">
            {valores.items.map((it) => (
              <div key={it.titulo} className="card flex gap-4 p-5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name={it.icono || "shield"} size={22} /></span>
                <div><h3 className="font-display font-bold text-navy">{it.titulo}</h3><p className="mt-1 text-sm leading-relaxed text-slate-500">{it.texto}</p></div>
              </div>
            ))}
          </div>
        </section>
      )}

      {cierre.visible && (
        <section className="container-x pb-4">
          <div className="card relative overflow-hidden p-8 text-center sm:p-12">
            <div aria-hidden className="absolute inset-0 blueprint-dark" />
            <div className="relative">
              <h2 className="font-display text-2xl font-extrabold text-navy">{cierre.title}</h2>
              {cierre.subtitle && <p className="mx-auto mt-3 max-w-xl text-slate-500">{cierre.subtitle}</p>}
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {cierre.items.map((it, i) => (
                  <Link key={it.titulo} href={it.href || "/catalogo"} className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}>{it.titulo}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
