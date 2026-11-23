import Icon from "@/components/brand/Icon";
import GarantiaForm from "./GarantiaForm";
import { leerSeccion } from "@/lib/contenido-server";

export const metadata = {
  title: "Reclamar garantía",
  description: "Reclama la garantía de una pieza comprada en Impacto Automotriz. 30 días desde la entrega.",
};

export default async function Garantia() {
  const [plazos, hero] = await Promise.all([leerSeccion("garantia-plazos"), leerSeccion("garantia-hero")]);
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[color:var(--color-action)]/20 blur-3xl" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">{hero.eyebrow}</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold">{hero.title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{hero.subtitle}</p>
        </div>
      </section>

      <section className="container-x py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <h2 className="font-display text-xl font-extrabold text-navy">Qué cubre la garantía</h2>
            <ul className="mt-4 space-y-3">
              {plazos.visible && plazos.items.map((it) => (
                <li key={it.titulo} className="card flex gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/10 text-[color:var(--color-action)]">
                    <Icon name={it.icono || "info"} size={19} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-navy">{it.titulo}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{it.texto}</p>
                  </div>
                </li>
              ))}
            </ul>
            <p className="mt-4 text-sm text-slate-500">
              Conserva el comprobante del pedido: con el número nos basta para localizarlo.
            </p>
          </div>

          <div>
            <h2 className="font-display text-xl font-extrabold text-navy">Empezar la reclamación</h2>
            <div className="mt-4">
              <GarantiaForm />
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
