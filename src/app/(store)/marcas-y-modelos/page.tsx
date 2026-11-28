import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBrandsCached } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/brand/Icon";
import VehicleFinder from "@/components/site/VehicleFinder";
import { leerSeccion } from "@/lib/contenido-server";
import { getT } from "@/lib/i18n";
import { nombreMarca } from "@/lib/datos-i18n";

export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("brands.title") };
}
export const dynamic = "force-dynamic";

export default async function MarcasYModelos() {
  const { t, lang } = await getT();
  const [marcas, productos, hero] = await Promise.all([
    getBrandsCached(),
    prisma.product.findMany({
      where: { active: true },
      orderBy: { id: "desc" },
      include: { brand: true, category: { select: { slug: true, name: true, nameEn: true } } },
    }),
    leerSeccion("marcas-hero"),
  ]);

  const porMarca = marcas
    .map((m) => ({ ...m, items: productos.filter((p) => p.brandId === m.id) }))
    .filter((m) => m.items.length > 0);

  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">{hero.eyebrow}</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">{hero.title}</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">{hero.subtitle}</p>
          <div className="mt-8 max-w-xl"><VehicleFinder /></div>
        </div>
      </section>

      <section className="container-x py-12">
        <div className="flex flex-wrap gap-2">
          {porMarca.map((m) => (
            <a key={m.id} href={`#marca-${m.slug}`} className="chip">
              {nombreMarca(m, lang)}<span className="font-mono text-[10px] text-slate-500">{m.items.length}</span>
            </a>
          ))}
        </div>

        {porMarca.length === 0 && (
          <div className="card mt-8 p-10 text-center">
            <Icon name="car" size={40} className="mx-auto text-slate-300" />
            <h2 className="mt-3 font-display text-lg font-bold text-navy">{t("brands.emptyTitle")}</h2>
            <p className="mt-1 text-sm text-slate-500">{t("brands.emptyHint")}</p>
            <Link href="/catalogo" className="btn btn-primary mt-5">{t("brands.viewCatalog")}</Link>
          </div>
        )}

        {porMarca.map((m) => (
          <section key={m.id} id={`marca-${m.slug}`} className="mt-12 scroll-mt-32">
            <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
              <div>
                <h2 className="font-display text-xl font-extrabold text-navy sm:text-2xl">{nombreMarca(m, lang)}</h2>
                <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-slate-500">{t("brands.products").replace("{n}", String(m.items.length))}</p>
              </div>
              <Link href={`/catalogo?marca=${m.slug}`} className="flex shrink-0 items-center gap-1 text-sm font-bold text-[color:var(--color-action)] transition hover:text-navy">
                {t("brands.seeAll")} <Icon name="arrowRight" size={15} />
              </Link>
            </div>
            <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
              {m.items.slice(0, 4).map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </section>
        ))}
      </section>
    </div>
  );
}
