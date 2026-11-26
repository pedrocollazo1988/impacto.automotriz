import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBrandsCached, getCategoriesCached } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/brand/Icon";
import VehicleFinder from "@/components/site/VehicleFinder";
import SectionHead from "@/components/site/SectionHead";
import PasosCompra from "@/components/site/PasosCompra";
import PromoSlider, { type Slide } from "@/components/site/PromoSlider";
import HeroRotator from "@/components/site/HeroRotator";
import StoreBars from "@/components/site/StoreBars";
import Reveal from "@/components/site/Reveal";
import { skusConGiro } from "@/lib/photo360";
import { leerSeccion } from "@/lib/contenido-server";
import { getT } from "@/lib/i18n";
export const dynamic = "force-dynamic";

const CAT_ICON: Record<string, string> = { frenos: "gauge", "sistema-electrico": "bolt", electrico: "bolt", suspension: "layers", "triciclos-electricos": "battery", motor: "wrench", accesorios: "box" };

export default async function Home() {
  const { t } = await getT();
  const hayGiro = skusConGiro().length > 0;
  const [valor, confianza, accesos, hero, slider, catHead, destHead, ofertasHead, novHead, marcasHead, pasos, cierre] = await Promise.all([
    leerSeccion("portada-valor"),
    leerSeccion("portada-confianza"),
    leerSeccion("portada-accesos"),
    leerSeccion("portada-hero"),
    leerSeccion("portada-slider"),
    leerSeccion("portada-categorias"),
    leerSeccion("portada-destacados"),
    leerSeccion("portada-ofertas"),
    leerSeccion("portada-novedades"),
    leerSeccion("portada-marcas"),
    leerSeccion("portada-pasos"),
    leerSeccion("portada-cta"),
  ]);
  const [todos, offers, categories, brands, total] = await Promise.all([
    prisma.product.findMany({ where: { active: true }, orderBy: { id: "desc" }, include: { brand: true, category: { select: { slug: true, name: true } } } }),
    prisma.product.findMany({ where: { active: true, compareAtUsd: { not: null } }, take: 4, orderBy: { id: "desc" }, include: { brand: true, category: { select: { slug: true, name: true } } } }),
    getCategoriesCached(),
    getBrandsCached(12),
    prisma.product.count({ where: { active: true } }),
  ]);

  const featured = todos.filter((p) => p.featured).slice(0, 8);
  const latest = [...todos].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)).slice(0, 8);
  const heroImages = [...new Set(todos.map((p) => p.images[0]).filter(Boolean))].slice(0, 6);

  // Filas por departamento, como las secciones de la tienda de MCV: cada una
  // con su encabezado y una tira de productos, de la categoría con más stock.
  const departamentos = categories
    .map((c) => ({ ...c, items: todos.filter((p) => p.category?.slug === c.slug).slice(0, 8) }))
    .filter((c) => c.items.length >= 2)
    .sort((a, b) => b.items.length - a.items.length)
    .slice(0, 4);
  const marquee = brands.length >= 4 ? brands : [...brands, ...brands];
  const heroLineas = hero.title.split("\n");
  const heroCtas = hero.items.filter((i) => i.href);
  const heroCifras = hero.items.filter((i) => !i.href);
  const heroEyebrow = hero.eyebrow.replace("{total}", String(total));

  // El carrusel usa lo que el panel haya guardado. Si está vacío, se arma solo
  // con ofertas y destacados, sin repetir productos.
  const vistos = new Set<number>();
  const autoSlides: Slide[] = [...offers, ...featured, ...latest]
    .filter((p) => {
      if (!p.images[0] || vistos.has(p.id)) return false;
      vistos.add(p.id);
      return true;
    })
    .slice(0, 6)
    .map((p) => {
      const precio = Number(p.priceUsd);
      const antes = p.compareAtUsd && Number(p.compareAtUsd) > precio ? `Antes ${Number(p.compareAtUsd).toFixed(2)} USD · ` : "";
      return {
        imagen: p.images[0],
        titulo: p.name,
        texto: `${antes}${precio.toFixed(2)} USD${p.brand?.name ? ` · ${p.brand.name}` : ""}`,
        href: `/producto/${p.slug}`,
        icono: p.compareAtUsd ? "tag" : "star",
      };
    });
  const slidesPersonalizados: Slide[] = slider.items
    .filter((i) => i.imagen && i.titulo)
    .map((i) => ({ imagen: i.imagen!, titulo: i.titulo!, texto: i.texto, href: /^(\/(?!\/)|https?:\/\/)/i.test(i.href ?? "") ? i.href! : "/ofertas", icono: i.icono }));
  const slides: Slide[] = slider.visible ? (slidesPersonalizados.length ? slidesPersonalizados : autoSlides) : [];

  return (
    <div>
      <PromoSlider items={slides} />
      <StoreBars />

      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        {heroImages.length > 1 && (
          <div className="absolute inset-0 opacity-25" aria-hidden>
            <HeroRotator images={heroImages} intervalMs={5500} />
          </div>
        )}
        <div aria-hidden className="absolute inset-0 bg-gradient-to-r from-[color:var(--color-navy-deep)] via-[color:var(--color-navy-deep)]/90 to-[color:var(--color-navy-deep)]/55" />
        <div className="absolute inset-0 blueprint opacity-70" aria-hidden />
        <div aria-hidden className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[color:var(--color-action)]/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 h-[360px] w-[360px] rounded-full bg-[color:var(--color-action-hi)]/10 blur-3xl" />
        <div className="container-x relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow eyebrow-light inline-flex items-center gap-2"><Icon name="spark" size={14} /> {heroEyebrow}</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              {heroLineas.map((linea, i) => (
                <span key={i} className={i === heroLineas.length - 1 ? "bg-gradient-to-r from-[color:var(--color-action-hi)] to-[color:var(--color-action-hi)] bg-clip-text text-transparent" : ""}>
                  {i > 0 && <br />}
                  {linea}
                </span>
              ))}
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              {hero.subtitle} {hayGiro ? t("home.hero360") : t("home.heroPhotos")}
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              {heroCtas.map((it, i) => (
                <Link key={it.titulo} href={it.href!} className={`btn text-base ${i === 0 ? "btn-accent" : "btn-outline-light"}`}>
                  <Icon name={it.icono || "grid"} size={18} /> {it.titulo}
                </Link>
              ))}
            </div>
            {heroCifras.length > 0 && (
              <dl className="mt-10 grid max-w-lg grid-cols-2 gap-4 border-t border-white/10 pt-6 sm:grid-cols-3">
                {heroCifras.map((it) => (
                  <div key={it.titulo}><dt className="font-mono text-[10px] uppercase tracking-widest text-white/45">{it.titulo}</dt><dd className="mt-1 text-sm font-semibold text-white/90">{it.texto}</dd></div>
                ))}
              </dl>
            )}
          </div>
          <div className="animate-fade-up delay-2">
            <VehicleFinder />
          </div>
        </div>
      </section>

      {/* ── Franja de confianza: lo que el cliente necesita saber antes de comprar ── */}
      {confianza.visible && confianza.items.length > 0 && (
        <section aria-label={t("home.advantages")} className="border-b border-slate-200 bg-white">
          <div className="container-x grid grid-cols-2 gap-x-6 gap-y-4 py-5 sm:grid-cols-4">
            {confianza.items.map((it) => (
              <div key={it.titulo} className="flex items-center gap-2.5">
                <span className="grid h-9 w-9 shrink-0 place-items-center rounded-full bg-[color:var(--color-action)]/10 text-[color:var(--color-action)]">
                  <Icon name={it.icono || "check"} size={17} />
                </span>
                <div className="min-w-0">
                  <p className="text-[13px] font-bold leading-tight text-navy">{it.titulo}</p>
                  <p className="truncate text-[11px] text-slate-500">{it.texto}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Accesos rápidos, como los botones de MCV ── */}
      {accesos.visible && accesos.items.length > 0 && (
        <section className="container-x mt-10">
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {accesos.items.map((it) => (
              <Link key={it.href ?? it.titulo} href={it.href || "/catalogo"} className="card card-hover group flex items-start gap-3 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-navy)] text-white transition duration-300 group-hover:-translate-y-0.5 group-hover:bg-[color:var(--color-action)] group-hover:text-white">
                  <Icon name={it.icono || "grid"} size={21} />
                </span>
                <span className="min-w-0">
                  <span className="block font-display text-sm font-bold text-navy">{it.titulo}</span>
                  <span className="mt-0.5 block text-xs leading-snug text-slate-500">{it.texto}</span>
                </span>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Valor ── */}
      {valor.visible && valor.items.length > 0 && (
        <section className="container-x mt-4 relative z-10">
          <h2 className="sr-only">{valor.title || t("home.why")}</h2>
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {valor.items.map((it, i) => (
              <div key={it.titulo} className={`card p-5 animate-fade-up delay-${(i % 4) + 1}`}>
                <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name={it.icono || "check"} size={22} /></span>
                <h3 className="mt-3.5 font-display text-sm font-bold text-navy">{it.titulo}</h3>
                <p className="mt-1 text-xs leading-relaxed text-slate-500">{it.texto}</p>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* ── Categorías ── */}
      {catHead.visible && categories.length > 0 && (
        <section className="container-x mt-16">
          <SectionHead eyebrow={catHead.eyebrow} title={catHead.title} subtitle={catHead.subtitle} href="/catalogo" linkLabel={t("home.seeCatalog")} />
          <Reveal className="mt-6 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/catalogo?categoria=${c.slug}`} className="card card-hover group flex items-center gap-3 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[color:var(--color-navy)] to-[color:var(--color-action)] text-white transition group-hover:scale-105">
                  <Icon name={c.icon || CAT_ICON[c.slug] || "box"} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-bold text-navy">{c.name}</span>
                  <span className="block truncate font-mono text-[10px] uppercase tracking-wider text-slate-500">{c._count.products} {t("home.products")}</span>
                  {c.description && <span className="block truncate text-[10px] text-slate-400">{c.description}</span>}
                </span>
                <Icon name="chevronRight" size={16} className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[color:var(--color-action)]" />
              </Link>
            ))}
          </Reveal>
        </section>
      )}

      {/* ── Departamentos, como las secciones de la tienda de MCV ── */}
      {departamentos.map((d) => (
        <section key={d.id} className="container-x mt-16">
          <div className="flex items-end justify-between gap-4 border-b border-slate-200 pb-3">
            <div>
              <h2 className="font-display text-xl font-extrabold text-navy sm:text-2xl">{d.name}</h2>
              <p className="mt-0.5 font-mono text-[11px] uppercase tracking-wider text-slate-500">{d._count.products} {t("home.products")}</p>
            </div>
            <Link href={`/catalogo?categoria=${d.slug}`} className="flex shrink-0 items-center gap-1 text-sm font-bold text-[color:var(--color-action)] transition hover:text-navy">
              {t("home.seeAll")} <Icon name="arrowRight" size={15} />
            </Link>
          </div>
          <div className="mt-5 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {d.items.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      ))}

      {/* ── Destacados ── */}
      {destHead.visible && featured.length > 0 && (
        <section className="container-x mt-16">
          <SectionHead eyebrow={destHead.eyebrow} title={destHead.title} subtitle={destHead.subtitle} href="/catalogo" linkLabel={t("home.seeCatalog")} />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Ofertas ── */}
      {ofertasHead.visible && offers.length > 0 && (
        <section className="container-x mt-16">
          <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[color:var(--color-navy)] to-[color:var(--color-navy-deep)] p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div>
                <span className="eyebrow eyebrow-light inline-flex items-center gap-2"><Icon name="tag" size={14} /> {ofertasHead.eyebrow}</span>
                <h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">{ofertasHead.title}</h2>
                {ofertasHead.subtitle && <p className="mt-1 max-w-xl text-sm text-white/70">{ofertasHead.subtitle}</p>}
              </div>
              {ofertasHead.items[0] && (
                <Link href={ofertasHead.items[0].href || "/ofertas"} className="btn btn-outline-light">{ofertasHead.items[0].titulo} <Icon name="arrowRight" size={16} /></Link>
              )}
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {offers.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Novedades ── */}
      {novHead.visible && latest.length > 0 && (
        <section className="container-x mt-16">
          <SectionHead eyebrow={novHead.eyebrow} title={novHead.title} subtitle={novHead.subtitle} href="/catalogo" />
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {latest.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Marcas ── */}
      {marcasHead.visible && marquee.length > 0 && (
        <section className="container-x mt-16">
          <p className="text-center font-mono text-xs uppercase tracking-[0.25em] text-slate-400">{marcasHead.title}</p>
          <div className="relative mt-5 overflow-hidden [mask-image:linear-gradient(90deg,transparent,#000_12%,#000_88%,transparent)]">
            <div className="marquee gap-4">
              {marquee.concat(marquee).map((b, i) => (
                <span key={`${b.id}-${i}`} className="grid h-16 w-40 shrink-0 place-items-center rounded-2xl border border-slate-200 bg-white font-display text-sm font-bold text-slate-500">
                  {b.name}
                </span>
              ))}
            </div>
          </div>
        </section>
      )}

      {pasos.visible && <PasosCompra eyebrow={pasos.eyebrow} title={pasos.title} pasos={pasos.items.map((i) => [i.icono || "check", i.titulo || "", i.texto || ""])} />}

      {/* ── CTA final ── */}
      {cierre.visible && (
        <section className="container-x mt-16">
          <div className="card relative overflow-hidden p-8 text-center sm:p-12">
            <div aria-hidden className="absolute inset-0 blueprint-dark" />
            <div className="relative">
              <h2 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">{cierre.title}</h2>
              <p className="mx-auto mt-3 max-w-xl text-slate-500">{cierre.subtitle}</p>
              <div className="mt-6 flex flex-wrap justify-center gap-3">
                {cierre.items.map((it, i) => (
                  <Link key={it.titulo} href={it.href || "/contacto"} className={`btn ${i === 0 ? "btn-primary" : "btn-ghost"}`}>{it.titulo}</Link>
                ))}
              </div>
            </div>
          </div>
        </section>
      )}
    </div>
  );
}
