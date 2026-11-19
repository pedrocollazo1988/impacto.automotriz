import Icon from "@/components/brand/Icon";
export const metadata = { title: "Contacto" };

export default function Contacto() {
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const bank = process.env.BANK_INSTRUCTIONS;
  const CONTACT: [string, string, string, string?][] = [
    ["whatsapp", "WhatsApp", wa ? `+${wa}` : "Escríbenos", wa ? `https://wa.me/${wa}` : undefined],
    ["mail", "Correo", "ventas@impactoautomotriz.cu"],
    ["phone", "Teléfono", wa ? `+${wa}` : "—"],
    ["clock", "Horario", "Lunes a sábado, 9:00 – 18:00"],
  ];
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">Atención al cliente</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold">Estamos para ayudarte</h1>
          <p className="mt-3 max-w-2xl text-white/75">Consúltanos por WhatsApp con la marca, modelo y año de tu vehículo, o escríbenos por correo. Te respondemos lo antes posible.</p>
        </div>
      </section>
      <section className="container-x py-10">
        <div className="grid gap-6 lg:grid-cols-[1fr_1fr]">
          <div className="grid gap-3 sm:grid-cols-2">
            {CONTACT.map(([ic, t, v, href]) => (
              <div key={t} className="card p-5">
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-accent-deep)]"><Icon name={ic} size={22} /></span>
                <h2 className="mt-3 font-display text-sm font-bold text-navy">{t}</h2>
                {href ? <a href={href} target="_blank" rel="noopener" className="mt-1 block text-sm text-slate-600 link-underline">{v}</a> : <p className="mt-1 text-sm text-slate-600">{v}</p>}
              </div>
            ))}
          </div>
          <div className="card p-6">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><Icon name="pin" size={18} /> Nuestra tienda</h2>
            <p className="mt-3 text-sm text-slate-600">Calle 29 No. 5408 e/ 54 y 56, Artemisa, Cuba. Código postal 33800.</p>
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
