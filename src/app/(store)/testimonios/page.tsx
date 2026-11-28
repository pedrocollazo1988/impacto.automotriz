import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import Icon from "@/components/brand/Icon";
import { leerSeccion } from "@/lib/contenido-server";
import { getT } from "@/lib/i18n";
import { nombreProducto } from "@/lib/datos-i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("reviews2.meta") };
}
export const dynamic = "force-dynamic";

function Estrellas({ n, aria }: { n: number; aria: string }) {
  return (
    <span className="flex gap-0.5" aria-label={aria}>
      {[1, 2, 3, 4, 5].map((i) => (
        <Icon key={i} name="star" size={14} className={i <= n ? "text-[color:var(--color-action)]" : "text-slate-200"} />
      ))}
    </span>
  );
}

export default async function Testimonios() {
  const { t, lang } = await getT();
  const [hero, vacio] = await Promise.all([leerSeccion("testimonios-hero"), leerSeccion("testimonios-vacio")]);
  const resenas = await prisma.review.findMany({
    where: { visible: true },
    orderBy: { createdAt: "desc" },
    take: 24,
    include: { product: { select: { slug: true, name: true, nameEn: true } } },
  });

  const media = resenas.length > 0 ? resenas.reduce((a, r) => a + r.rating, 0) / resenas.length : 0;

  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">{hero.eyebrow}</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">{hero.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{hero.subtitle}</p>
          {resenas.length > 0 && (
            <div className="mt-6 flex items-center gap-3">
              <Estrellas n={Math.round(media)} aria={t("reviews2.stars").replace("{n}", String(Math.round(media)))} />
              <span className="font-display text-lg font-extrabold">{media.toFixed(1)}</span>
              <span className="text-sm text-white/60">
                {t(resenas.length === 1 ? "reviews2.ofReview" : "reviews2.ofReviews").replace("{n}", String(resenas.length))}
              </span>
            </div>
          )}
        </div>
      </section>

      <section className="container-x py-12">
        {resenas.length === 0 ? (
          <div className="card p-10 text-center">
            <Icon name="star" size={40} className="mx-auto text-slate-300" />
            <h2 className="mt-3 font-display text-lg font-bold text-navy">{vacio.title}</h2>
            <p className="mx-auto mt-1 max-w-md text-sm text-slate-500">{vacio.subtitle}</p>
            <div className="mt-5 flex flex-wrap justify-center gap-3">
              <Link href="/cuenta" className="btn btn-primary">{t("reviews2.goAccount")}</Link>
              <Link href="/catalogo" className="btn btn-ghost">{t("reviews2.viewCatalog")}</Link>
            </div>
          </div>
        ) : (
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {resenas.map((r) => (
              <article key={r.id} className="card flex flex-col p-5">
                <Estrellas n={r.rating} aria={t("reviews2.stars").replace("{n}", String(r.rating))} />
                <p className="mt-3 flex-1 text-sm leading-relaxed text-slate-600">“{r.comment}”</p>
                <Link href={`/producto/${r.product.slug}`} className="mt-4 border-t border-slate-100 pt-3 text-xs font-semibold text-navy transition hover:text-[color:var(--color-action)]">
                  {nombreProducto(r.product, lang)}
                </Link>
              </article>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
