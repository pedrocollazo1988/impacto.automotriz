import Icon from "@/components/brand/Icon";
import GarantiaForm from "./GarantiaForm";

export const metadata = {
  title: "Reclamar garantía",
  description: "Reclama la garantía de una pieza comprada en Impacto Automotriz. 30 días desde la entrega.",
};

const PLAZOS: [string, string, string][] = [
  ["clock", "30 días", "Desde la fecha de entrega para reclamar por defecto de fabricación."],
  ["wrench", "Piezas y mano de obra", "Si la pieza falla por defecto, la reponemos o devolvemos el importe."],
  ["info", "No cubre el desgaste", "El uso normal, una instalación incorrecta o daños por accidente no entran en garantía."],
];

export default function Garantia() {
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div aria-hidden className="absolute -right-20 -top-20 h-72 w-72 rounded-full bg-[color:var(--color-action)]/20 blur-3xl" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">Postventa</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold">Reclamar garantía</h1>
          <p className="mt-3 max-w-2xl text-white/75">
            Si una pieza te ha dado problemas, dinos cuál es tu pedido y qué ocurre. Lo revisamos y te damos una solución.
          </p>
        </div>
      </section>

      <section className="container-x py-10">
        <div className="grid gap-8 lg:grid-cols-[1fr_1.05fr]">
          <div>
            <h2 className="font-display text-xl font-extrabold text-navy">Qué cubre la garantía</h2>
            <ul className="mt-4 space-y-3">
              {PLAZOS.map(([ic, t, d]) => (
                <li key={t} className="card flex gap-3 p-4">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/10 text-[color:var(--color-action)]">
                    <Icon name={ic} size={19} />
                  </span>
                  <div>
                    <p className="font-display text-sm font-bold text-navy">{t}</p>
                    <p className="mt-0.5 text-sm leading-relaxed text-slate-600">{d}</p>
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
