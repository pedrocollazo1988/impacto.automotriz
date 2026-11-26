import type { Metadata } from "next";
import Image from "next/image";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import SubscribeForm from "@/components/site/SubscribeForm";
import { BLOG_ARTICLES, type BlogArticle } from "@/lib/blog";
import { leerSeccion } from "@/lib/contenido-server";
import { buscarSeccion, type Item } from "@/lib/contenido";
import { getT } from "@/lib/i18n";

const SITE_URL = process.env.PUBLIC_URL ?? "http://localhost:3000";

export const metadata: Metadata = {
  title: "Blog de marcas destacadas",
  description:
    "Guías de compra de Brembo, Bosch, KYB, Varta y Monroe: cómo elegir frenos, alternadores, filtros, amortiguadores y baterías con criterio, compatibilidad y garantía.",
  keywords: [
    "blog de autopartes",
    "Brembo pastillas de freno",
    "Bosch alternador",
    "KYB amortiguadores",
    "Varta batería",
    "Monroe suspensión",
    "consejos de compra de repuestos",
  ],
  alternates: { canonical: "/blog" },
  openGraph: {
    type: "website",
    title: "Blog de marcas destacadas · Impacto Automotriz",
    description:
      "Cuatro guías prácticas para comprar frenos, componentes eléctricos y suspensión sin caer en imitaciones ni piezas incompatibles.",
    url: "/blog",
    images: [
      {
        url: "/products/brake-pad.webp",
        width: 1200,
        height: 800,
        alt: "Pastillas de freno Brembo",
      },
    ],
  },
  twitter: {
    card: "summary_large_image",
    title: "Blog de marcas destacadas · Impacto Automotriz",
    description:
      "Brembo, Bosch, KYB, Varta y Monroe: guías de compra, señales de desgaste y consejos de instalación.",
    images: ["/products/brake-pad.webp"],
  },
  robots: { index: true, follow: true },
};

const formatearFecha = (iso: string) => {
  const fecha = new Date(iso);
  if (!iso || Number.isNaN(fecha.getTime())) return iso;
  return new Intl.DateTimeFormat("es-ES", {
    day: "numeric",
    month: "long",
    year: "numeric",
    timeZone: "UTC",
  }).format(fecha);
};

const slugSeguro = (texto: string, respaldo: string) => {
  const slug = texto
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
  return slug || respaldo;
};

const slugDeMarca = (marca: string) => slugSeguro(marca, "");

const separar = (texto: string | undefined, separador: RegExp) =>
  (texto ?? "")
    .split(separador)
    .map((linea) => linea.trim())
    .filter(Boolean);

/** Convierte los elementos guardados en el panel en artículos, cayendo en la guía
 *  de fábrica (por slug) para lo que el editor no tenga. */
function articulosDesdeItems(items: Item[]): BlogArticle[] {
  const fabrica = new Map(BLOG_ARTICLES.map((a) => [a.slug, a]));
  const usados = new Set<string>();
  return items.map((it, i) => {
    const base = it.href ? fabrica.get(it.href.trim()) : undefined;
    const baseSlug = slugSeguro(it.href?.trim() || base?.slug || "", `guia-${i + 1}`);
    let slug = baseSlug;
    let sufijo = 2;
    while (usados.has(slug)) slug = `${baseSlug}-${sufijo++}`;
    usados.add(slug);
    const marca = it.marca?.trim() || base?.brand || "";
    const marcaEditada = !!it.marca?.trim() && it.marca.trim() !== base?.brand;
    const minutos = Number.parseInt(it.lectura ?? "", 10);
    const parrafos = separar(it.parrafos, /\n\s*\n/);
    const puntos = separar(it.puntos, /\r?\n/);
    return {
      slug,
      title: it.titulo?.trim() || base?.title || "",
      excerpt: it.texto?.trim() || base?.excerpt || "",
      date: it.fecha?.trim() || base?.date || "",
      brand: marca,
      image: it.imagen || base?.image || "/products/brake-pad.webp",
      imageAlt: base?.imageAlt || it.titulo?.trim() || marca,
      readingTime: Number.isFinite(minutos) && minutos > 0 ? minutos : base?.readingTime ?? 0,
      paragraphs: parrafos.length ? parrafos : base?.paragraphs ?? [],
      highlights: puntos.length ? puntos : base?.highlights ?? [],
      brandLinks: base?.brandLinks.length && !marcaEditada
        ? base.brandLinks
        : marca
          ? [{ name: marca, slug: slugDeMarca(marca) }]
          : [],
    };
  });
}

/** Lo editado en el panel manda; si el valor sigue siendo el de fábrica, se usa
 *  la traducción, que es lo que se veía antes de que existiera la sección. */
const textoEditable = (valor: string, fabrica: string | undefined, traducido: string) =>
  valor && valor !== fabrica ? valor : traducido || valor;

export default async function BlogPage() {
  const { t } = await getT();
  const [hero, guiasHead, boletin, guias] = await Promise.all([
    leerSeccion("blog-hero"),
    leerSeccion("blog-guias"),
    leerSeccion("blog-boletin"),
    leerSeccion("blog-articulos"),
  ]);
  const articulos = articulosDesdeItems(guias.items);
  const articulosVisibles = guias.visible ? articulos : [];
  const heroFab = buscarSeccion("blog-hero")?.defecto;
  const guiasFab = buscarSeccion("blog-guias")?.defecto;
  const boletinFab = buscarSeccion("blog-boletin")?.defecto;
  const heroEyebrow = textoEditable(hero.eyebrow, heroFab?.eyebrow, t("blog.eyebrow"));
  const heroTitle = textoEditable(hero.title, heroFab?.title, t("blog.title"));
  const heroIntro = textoEditable(hero.subtitle, heroFab?.subtitle, t("blog.intro"));
  const guiasEyebrow = textoEditable(guiasHead.eyebrow, guiasFab?.eyebrow, t("blog.guides"));
  const guiasTitle = textoEditable(guiasHead.title, guiasFab?.title, t("blog.guidesTitle"));
  const guiasIntro = textoEditable(guiasHead.subtitle, guiasFab?.subtitle, t("blog.guidesIntro"));
  const boletinEyebrow = textoEditable(boletin.eyebrow, boletinFab?.eyebrow, t("blog.newsletterEyebrow"));
  const boletinTitle = textoEditable(boletin.title, boletinFab?.title, t("blog.newsletterTitle"));
  const boletinTexto = textoEditable(boletin.subtitle, boletinFab?.subtitle, t("blog.newsletterText"));
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: "Blog de marcas destacadas · Impacto Automotriz",
    url: `${SITE_URL}/blog`,
    description:
      "Guías de compra de Brembo, Bosch, KYB, Varta y Monroe para mantener el vehículo con piezas compatibles y fiables.",
    blogPost: articulosVisibles.map((a) => ({
      "@type": "BlogPosting",
      headline: a.title,
      description: a.excerpt,
      datePublished: a.date,
      image: /^https?:\/\//i.test(a.image) ? a.image : `${SITE_URL}${a.image}`,
      url: `${SITE_URL}/blog#${a.slug}`,
      author: { "@type": "Organization", name: "Impacto Automotriz" },
      publisher: { "@type": "Organization", name: "Impacto Automotriz" },
    })),
  };

  return (
    <div>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
      />

      {hero.visible && (
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14 sm:py-16 lg:py-20">
          <span className="eyebrow eyebrow-light">{heroEyebrow}</span>
          <h1 className="mt-2 max-w-4xl font-display text-3xl font-extrabold leading-tight sm:text-4xl lg:text-5xl">
            {heroTitle}
          </h1>
          <p className="mt-4 max-w-2xl text-base leading-relaxed text-white/75 sm:text-lg">
            {heroIntro}
          </p>
          <div className="mt-6 flex flex-wrap gap-2">
            {articulosVisibles.filter((a) => a.brand).map((a) => (
              <a
                key={a.slug}
                href={`#${a.slug}`}
                className="inline-flex min-h-10 items-center rounded-full border border-white/20 bg-white/10 px-3 py-1.5 text-xs font-semibold text-white transition hover:bg-white/20"
              >
                {a.brand}
              </a>
            ))}
          </div>
        </div>
      </section>
      )}

      {guiasHead.visible && articulosVisibles.length > 0 && (
      <section className="container-x py-10 sm:py-12">
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <span className="eyebrow text-slate-500">{guiasEyebrow}</span>
            <h2 className="sec-title mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">
              {guiasTitle}
            </h2>
          </div>
          <p className="max-w-md text-sm leading-relaxed text-slate-500">
            {guiasIntro}
          </p>
        </div>

        <div className="mt-6 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
          {articulosVisibles.map((a) => (
            <a key={a.slug} href={`#${a.slug}`} className="card card-hover group flex flex-col overflow-hidden">
              <div className="relative aspect-[16/10] w-full overflow-hidden bg-slate-100">
                <Image
                  src={a.image}
                  alt={a.imageAlt}
                  fill
                  unoptimized={/^https?:\/\//i.test(a.image)}
                  sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 25vw"
                  className="object-cover transition duration-500 group-hover:scale-105"
                />
              </div>
              <div className="flex flex-1 flex-col p-4">
                <div className="flex flex-wrap items-center gap-2 text-[11px] font-semibold uppercase tracking-wider text-slate-500">
                  <span>{a.brand}</span>
                  {a.readingTime > 0 && (
                    <>
                      <span aria-hidden>·</span>
                      <span>{a.readingTime} min</span>
                    </>
                  )}
                </div>
                <h3 className="mt-2 font-display text-base font-bold leading-snug text-navy">{a.title}</h3>
                <p className="mt-2 line-clamp-3 text-sm leading-relaxed text-slate-500">{a.excerpt}</p>
                <span className="mt-auto inline-flex items-center gap-1 pt-3 text-sm font-semibold text-navy">
                  {t("blog.read")} <Icon name="arrowRight" size={14} />
                </span>
              </div>
            </a>
          ))}
        </div>
      </section>
      )}

      {guias.visible && articulosVisibles.length > 0 && (
      <section className="container-x pb-4">
        <div className="space-y-6">
          {articulosVisibles.map((a, i) => {
            const imagenPrimero = i % 2 === 0;
            return (
              <article key={a.slug} id={a.slug} className="card scroll-mt-28 overflow-hidden">
                <div className="grid lg:grid-cols-2">
                  <div
                    className={`relative aspect-[16/10] w-full overflow-hidden bg-slate-100 lg:aspect-auto lg:min-h-full ${
                      imagenPrimero ? "" : "lg:order-2"
                    }`}
                  >
                    <Image
                      src={a.image}
                      alt={a.imageAlt}
                      fill
                      unoptimized={/^https?:\/\//i.test(a.image)}
                      sizes="(max-width: 1024px) 100vw, 50vw"
                      className="object-cover"
                    />
                  </div>

                  <div className={`p-5 sm:p-7 lg:p-8 ${imagenPrimero ? "" : "lg:order-1"}`}>
                    <div className="flex flex-wrap items-center gap-2">
                      <span className="badge bg-slate-100 text-slate-700">{a.brand}</span>
                      {a.date && (
                        <time dateTime={a.date} className="text-xs text-slate-500">
                          {formatearFecha(a.date)}
                        </time>
                      )}
                      {a.readingTime > 0 && (
                        <span className="text-xs text-slate-500">· {a.readingTime} min de lectura</span>
                      )}
                    </div>

                    <h2 className="mt-3 font-display text-2xl font-extrabold leading-tight text-navy sm:text-3xl">
                      {a.title}
                    </h2>
                    <p className="mt-3 text-base font-medium leading-relaxed text-slate-600">{a.excerpt}</p>

                    <div className="mt-4 space-y-3 text-sm leading-relaxed text-slate-600">
                      {a.paragraphs.map((parrafo, j) => (
                        <p key={j}>{parrafo}</p>
                      ))}
                    </div>

                    {a.highlights.length > 0 && (
                      <div className="mt-5 rounded-xl bg-slate-50 p-4">
                        <h3 className="font-display text-sm font-bold text-navy">{t("blog.essential")}</h3>
                        <ul className="mt-2 space-y-2">
                          {a.highlights.map((punto, j) => (
                            <li key={`${j}-${punto}`} className="flex gap-2 text-sm leading-relaxed text-slate-600">
                              <Icon
                                name="check"
                                size={16}
                                className="mt-0.5 shrink-0 text-emerald-700"
                                aria-hidden
                              />
                              <span>{punto}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                    {a.brandLinks.length > 0 && (
                      <div className="mt-5 flex flex-wrap gap-2">
                        {a.brandLinks.map((b, j) => (
                          <Link
                            key={`${j}-${b.slug}`}
                            href={`/catalogo?marca=${encodeURIComponent(b.slug)}`}
                            className={`btn ${j === 0 ? "btn-primary" : "btn-ghost"}`}
                          >
                            {t("blog.seeCatalog").replace("{brand}", b.name)}
                            <Icon name="arrowRight" size={15} />
                          </Link>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
      )}

      {boletin.visible && (
      <section id="suscribirme" className="container-x scroll-mt-28 py-10 sm:py-14">
        <div className="relative overflow-hidden rounded-2xl bg-[color:var(--color-navy-deep)] px-5 py-8 text-white sm:px-8 sm:py-10 lg:px-12">
          <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
          <div className="relative grid gap-6 lg:grid-cols-[1fr_minmax(0,28rem)] lg:items-center">
            <div>
              <span className="eyebrow eyebrow-light">{boletinEyebrow}</span>
              <h2 className="mt-2 font-display text-2xl font-extrabold leading-tight sm:text-3xl">
                {boletinTitle}
              </h2>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-white/75 sm:text-base">
                {boletinTexto}
              </p>
            </div>
            <div className="rounded-2xl bg-white p-4 shadow-card sm:p-5">
              <SubscribeForm />
            </div>
          </div>
        </div>
      </section>
      )}
    </div>
  );
}
