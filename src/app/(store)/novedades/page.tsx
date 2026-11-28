import Link from "next/link";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/brand/Icon";
import { leerSeccion } from "@/lib/contenido-server";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("news.meta") };
}
export const dynamic = "force-dynamic";

export default async function Novedades() {
  const { t } = await getT();
  const [hero, vacio] = await Promise.all([leerSeccion("novedades-hero"), leerSeccion("novedades-vacio")]);
  const productos = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 16,
    include: { brand: true, category: { select: { slug: true, name: true } } },
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">{hero.eyebrow}</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">{hero.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{hero.subtitle}</p>
        </div>
      </section>

      <section className="container-x py-12">
        {productos.length === 0 ? (
          <div className="card p-10 text-center">
            <Icon name="box" size={40} className="mx-auto text-slate-300" />
            <h2 className="mt-3 font-display text-lg font-bold text-navy">{vacio.title}</h2>
            <p className="mt-1 text-sm text-slate-500">{vacio.subtitle}</p>
            <Link href="/catalogo" className="btn btn-primary mt-5">{t("news.viewCatalog")}</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
