import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import Icon from "@/components/brand/Icon";
import { leerSeccion } from "@/lib/contenido-server";

const CLAVES: Record<string, string> = {
  envios: "politicas-envios",
  devoluciones: "politicas-devoluciones",
  privacidad: "politicas-privacidad",
  terminos: "politicas-terminos",
};

export function generateStaticParams() { return Object.keys(CLAVES).map((slug) => ({ slug })); }
export async function generateMetadata({ params }: { params: Promise<{ slug: string }> }): Promise<Metadata> {
  const clave = CLAVES[(await params).slug];
  const d = clave ? await leerSeccion(clave) : null;
  return { title: d?.title ?? "Políticas" };
}

export default async function Politica({ params }: { params: Promise<{ slug: string }> }) {
  const clave = CLAVES[(await params).slug];
  if (!clave) notFound();
  const d = await leerSeccion(clave);
  if (!d.visible) notFound();
  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <nav className="mb-3 flex items-center gap-1.5 text-xs text-white/50"><Link href="/" className="hover:text-white">Inicio</Link><Icon name="chevronRight" size={12} /><span>Políticas</span></nav>
          <h1 className="font-display text-4xl font-extrabold">{d.title}</h1>
          <p className="mt-3 max-w-2xl text-white/75">{d.subtitle}</p>
        </div>
      </section>
      <section className="container-x py-10">
        <div className="mx-auto max-w-3xl space-y-4">
          {d.items.map((it) => (
            <div key={it.titulo} className="card p-6">
              <h2 className="font-display text-lg font-bold text-navy">{it.titulo}</h2>
              <p className="mt-2 whitespace-pre-line leading-relaxed text-slate-600">{it.texto}</p>
            </div>
          ))}
          <div className="card flex flex-wrap items-center justify-between gap-3 p-6">
            <p className="text-sm text-slate-600">¿Tienes más preguntas sobre esta política?</p>
            <Link href="/contacto" className="btn btn-primary">Contactar</Link>
          </div>
        </div>
      </section>
    </div>
  );
}
