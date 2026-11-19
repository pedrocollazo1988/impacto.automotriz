import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { getBrandsCached, getCategoriesCached } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/brand/Icon";
import VehicleFinder from "@/components/site/VehicleFinder";
export const dynamic = "force-dynamic";

const VALUE_PROPS: [string, string, string][] = [
  ["cube", "Gira el vehículo eléctrico 360°", "En triciclos, bicicletas y patinetes eléctricos giras la foto real del vehículo antes de comprar."],
  ["car", "Compatibilidad con tu vehículo", "Guarda tu garaje y filtra solo las piezas que encajan con tu marca, modelo y año."],
  ["truck", "Entrega en toda Cuba", "Domicilio, mensajería, punto acordado o recogida en tienda, con tarifas por provincia y municipio."],
  ["card", "Pago en línea seguro", "Tropipay, QvaPay, transferencia o efectivo. Confirmación automática y comprobante de tu pedido."],
];

const CAT_ICON: Record<string, string> = { frenos: "gauge", "sistema-electrico": "bolt", electrico: "bolt", suspension: "layers", "triciclos-electricos": "battery", motor: "wrench", accesorios: "box" };

export default async function Home() {
  const [featured, offers, latest, categories, brands, total] = await Promise.all([
    prisma.product.findMany({ where: { active: true, featured: true }, take: 8, orderBy: { id: "desc" }, include: { brand: true, category: { select: { slug: true } } } }),
    prisma.product.findMany({ where: { active: true, compareAtUsd: { not: null } }, take: 4, orderBy: { id: "desc" }, include: { brand: true, category: { select: { slug: true } } } }),
    prisma.product.findMany({ where: { active: true }, take: 8, orderBy: { createdAt: "desc" }, include: { brand: true, category: { select: { slug: true } } } }),
    getCategoriesCached(),
    getBrandsCached(12),
    prisma.product.count({ where: { active: true } }),
  ]);
  const marquee = brands.length >= 4 ? brands : [...brands, ...brands];

  return (
    <div>
      {/* ── Hero ── */}
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div className="absolute inset-0 blueprint opacity-70" aria-hidden />
        <div aria-hidden className="absolute -right-24 -top-24 h-[420px] w-[420px] rounded-full bg-[color:var(--color-accent)]/25 blur-3xl" />
        <div aria-hidden className="absolute -bottom-32 left-1/3 h-[360px] w-[360px] rounded-full bg-[color:var(--color-volt)]/10 blur-3xl" />
        <div className="container-x relative grid items-center gap-12 py-16 lg:grid-cols-[1.05fr_0.95fr] lg:py-24">
          <div className="animate-fade-up">
            <span className="eyebrow eyebrow-light inline-flex items-center gap-2"><Icon name="spark" size={14} /> Tienda oficial · {total}+ productos</span>
            <h1 className="mt-4 font-display text-4xl font-extrabold leading-[1.05] sm:text-5xl lg:text-6xl">
              La pieza correcta<br />para tu vehículo,<br /><span className="bg-gradient-to-r from-[#8fc2ff] to-[#ffd27a] bg-clip-text text-transparent">a la primera.</span>
            </h1>
            <p className="mt-5 max-w-xl text-lg leading-relaxed text-white/75">
              Catálogo de partes, piezas y accesorios con compatibilidad por vehículo y pago en línea.
              Los vehículos eléctricos se pueden girar 360°.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <Link href="/catalogo" className="btn btn-accent text-base"><Icon name="grid" size={18} /> Explorar catálogo</Link>
              <Link href="/catalogo?vehiculo=1" className="btn btn-outline-light text-base"><Icon name="car" size={18} /> Buscar por mi vehículo</Link>
            </div>
            <dl className="mt-10 grid max-w-lg grid-cols-3 gap-4 border-t border-white/10 pt-6">
              {[["Entrega", "En toda Cuba"], ["Pago", "En línea o al recibir"], ["Soporte", "WhatsApp directo"]].map(([k, v]) => (
                <div key={k}><dt className="font-mono text-[10px] uppercase tracking-widest text-white/45">{k}</dt><dd className="mt-1 text-sm font-semibold text-white/90">{v}</dd></div>
              ))}
            </dl>
          </div>
          <div className="animate-fade-up delay-2">
            <VehicleFinder />
          </div>
        </div>
      </section>

      {/* ── Valor ── */}
      <section className="container-x -mt-8 relative z-10">
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-4">
          {VALUE_PROPS.map(([ic, t, d], i) => (
            <div key={t} className={`card p-5 animate-fade-up delay-${i + 1}`}>
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-accent-deep)]"><Icon name={ic} size={22} /></span>
              <h3 className="mt-3.5 font-display text-sm font-bold text-navy">{t}</h3>
              <p className="mt-1 text-xs leading-relaxed text-slate-500">{d}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Categorías ── */}
      {categories.length > 0 && (
        <section className="container-x mt-16">
          <div className="flex items-end justify-between gap-4">
            <div><span className="eyebrow">Explora por categoría</span><h2 className="mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">Encuentra lo que buscas</h2></div>
            <Link href="/catalogo" className="btn btn-ghost hidden sm:inline-flex">Ver todo <Icon name="arrowRight" size={16} /></Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {categories.map((c) => (
              <Link key={c.id} href={`/catalogo?categoria=${c.slug}`} className="card card-hover group flex items-center gap-3 p-4">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-[color:var(--color-navy)] to-[color:var(--color-accent)] text-white transition group-hover:scale-105">
                  <Icon name={CAT_ICON[c.slug] ?? "box"} size={22} />
                </span>
                <span className="min-w-0">
                  <span className="block truncate font-display text-sm font-bold text-navy">{c.name}</span>
                  <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{c._count.products} productos</span>
                </span>
                <Icon name="chevronRight" size={16} className="ml-auto shrink-0 text-slate-300 transition group-hover:translate-x-0.5 group-hover:text-[color:var(--color-accent)]" />
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* ── Destacados ── */}
      {featured.length > 0 && (
        <section className="container-x mt-16">
          <div className="flex items-end justify-between gap-4">
            <div><span className="eyebrow">Lo más buscado</span><h2 className="mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">Productos destacados</h2></div>
            <Link href="/catalogo" className="btn btn-ghost hidden sm:inline-flex">Ver catálogo <Icon name="arrowRight" size={16} /></Link>
          </div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {featured.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Ofertas ── */}
      {offers.length > 0 && (
        <section className="container-x mt-16">
          <div className="overflow-hidden rounded-[1.75rem] bg-gradient-to-br from-[color:var(--color-navy)] to-[color:var(--color-navy-deep)] p-6 text-white sm:p-8">
            <div className="flex flex-wrap items-end justify-between gap-4">
              <div><span className="eyebrow eyebrow-light inline-flex items-center gap-2"><Icon name="tag" size={14} /> Precios rebajados</span><h2 className="mt-1 font-display text-2xl font-extrabold sm:text-3xl">Ofertas del momento</h2></div>
              <Link href="/ofertas" className="btn btn-outline-light">Ver todas las ofertas <Icon name="arrowRight" size={16} /></Link>
            </div>
            <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-4">
              {offers.map((p) => <ProductCard key={p.id} p={p} />)}
            </div>
          </div>
        </section>
      )}

      {/* ── Novedades ── */}
      {latest.length > 0 && (
        <section className="container-x mt-16">
          <div><span className="eyebrow">Recién llegado</span><h2 className="mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">Novedades</h2></div>
          <div className="mt-6 grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {latest.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        </section>
      )}

      {/* ── Marcas ── */}
      {marquee.length > 0 && (
        <section className="container-x mt-16">
          <p className="text-center font-mono text-xs uppercase tracking-[0.25em] text-slate-400">Trabajamos con las mejores marcas</p>
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

      {/* ── CTA final ── */}
      <section className="container-x mt-16">
        <div className="card relative overflow-hidden p-8 text-center sm:p-12">
          <div aria-hidden className="absolute inset-0 blueprint-dark" />
          <div className="relative">
            <h2 className="font-display text-2xl font-extrabold text-navy sm:text-3xl">¿No encuentras la pieza?</h2>
            <p className="mx-auto mt-3 max-w-xl text-slate-500">Escríbenos por WhatsApp con la marca, modelo y año de tu vehículo y te ayudamos a localizarla.</p>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Link href="/contacto" className="btn btn-primary">Contactar ahora</Link>
              <Link href="/catalogo" className="btn btn-ghost">Ver catálogo</Link>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
