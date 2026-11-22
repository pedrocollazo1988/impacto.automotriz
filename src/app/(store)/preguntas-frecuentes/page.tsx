import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { leerSeccion } from "@/lib/contenido-server";

export const metadata = { title: "Preguntas frecuentes" };

export default async function FAQ() {
  const faq = await leerSeccion("faq");

  // FAQPage permite que Google y los asistentes de IA citen las respuestas
  // directamente. Se genera con el contenido que hay guardado, no con una lista
  // fija, para que editar una respuesta actualice también los datos estructurados.
  const ld = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faq.items.map((it) => ({
      "@type": "Question",
      name: it.titulo,
      acceptedAnswer: { "@type": "Answer", text: it.texto },
    })),
  };

  return (
    <div>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">{faq.eyebrow}</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold">{faq.title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{faq.subtitle}</p>
        </div>
      </section>
      <section className="container-x py-10">
        <div className="mx-auto max-w-3xl space-y-3">
          {faq.visible && faq.items.map((it) => (
            <details key={it.titulo} className="card group p-5 [&_summary::-webkit-details-marker]:hidden">
              <summary className="flex cursor-pointer items-center justify-between gap-4 font-display font-bold text-navy">
                {it.titulo}
                <span className="grid h-7 w-7 shrink-0 place-items-center rounded-lg bg-slate-100 text-slate-500 transition group-open:rotate-45"><Icon name="plus" size={16} /></span>
              </summary>
              <p className="mt-3 leading-relaxed text-slate-600">{it.texto}</p>
            </details>
          ))}
          <div className="card mt-6 flex flex-wrap items-center justify-between gap-3 p-5">
            <p className="text-sm text-slate-600">¿No encuentras la respuesta que buscas?</p>
            <Link href="/contacto" className="btn btn-primary">Contactar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
