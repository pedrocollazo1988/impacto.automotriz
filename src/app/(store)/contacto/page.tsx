import Icon from "@/components/brand/Icon";
import { leerSeccion } from "@/lib/contenido-server";

export const metadata = { title: "Contacto" };

export default async function Contacto() {
  // El WhatsApp y los datos bancarios siguen en variables de entorno: son
  // configuración sensible y no deben acabar en un campo de texto editable.
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const bank = process.env.BANK_INSTRUCTIONS;
  const datos = await leerSeccion("contacto-datos");

  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">{datos.eyebrow}</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold">{datos.title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{datos.subtitle}</p>
        </div>
      </section>
      <section className="container-x py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {wa && (
              <div className="card p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="whatsapp" size={22} /></span>
                <h2 className="mt-3 font-display text-sm font-bold text-navy">WhatsApp</h2>
                <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="mt-1 block text-sm text-slate-600 link-underline">+{wa}</a>
              </div>
            )}
            {datos.visible && datos.items.map((it) => (
              <div key={it.titulo} className="card p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name={it.icono || "info"} size={22} /></span>
                <h2 className="mt-3 font-display text-sm font-bold text-navy">{it.titulo}</h2>
                {it.href
                  ? <a href={it.href} target="_blank" rel="noopener" className="mt-1 block text-sm text-slate-600 link-underline">{it.texto}</a>
                  : <p className="mt-1 text-sm text-slate-600">{it.texto}</p>}
              </div>
            ))}
          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="pin" size={18} /> Nuestra tienda</h2>
            <div className="mt-4 overflow-hidden rounded-xl border border-slate-200">
              <iframe
                title="Ubicación de Impacto Automotriz"
                src="https://www.openstreetmap.org/export/embed.html?bbox=-82.78%2C22.80%2C-82.74%2C22.83&layer=mapnik"
                className="h-56 w-full" loading="lazy"
              />
            </div>
            {bank && <div className="mt-4 rounded-xl bg-slate-50 p-4 text-sm"><p className="font-semibold text-navy">Datos para transferencia</p><p className="mt-1 text-slate-600">{bank}</p></div>}
            {wa && <a href={`https://wa.me/${wa}`} target="_blank" rel="noopener" className="btn btn-primary mt-4 w-full"><Icon name="whatsapp" size={18} /> Escribir por WhatsApp</a>}
          </div>
        </div>
      </section>
    </div>
  );
}
