import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import AddToCart from "@/components/AddToCart";
import ModelViewer from "@/components/ModelViewer";
import ProductCard from "@/components/ProductCard";
import ProductGallery from "@/components/ProductGallery";
import WishlistButton from "@/components/WishlistButton";
import CompareToggle from "@/components/CompareToggle";
import ReviewForm from "@/components/ReviewForm";
import Icon from "@/components/brand/Icon";
import { getCustomer } from "@/lib/customer-auth";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };
const get = (slug: string) => prisma.product.findFirst({ where: { slug, active: true }, include: { brand: true, category: true, fits: true, variants: { where: { active: true }, orderBy: { id: "asc" } } } });

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const p = await get((await params).slug);
  return p ? { title: p.name, description: p.description.slice(0, 150), openGraph: { images: p.images.slice(0, 1) } } : {};
}

export default async function Producto({ params }: Props) {
  const p = await get((await params).slug);
  if (!p) notFound();
  prisma.product.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => {});
  const me = await getCustomer();
  const [reviews, inWish, bought] = await Promise.all([
    prisma.review.findMany({ where: { productId: p.id, visible: true }, orderBy: { id: "desc" }, take: 20, include: { customer: { select: { name: true } } } }),
    me ? prisma.wishlistItem.count({ where: { customerId: me.id, productId: p.id } }) : 0,
    me ? prisma.orderItem.count({ where: { productId: p.id, order: { customerId: me.id, status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } } }) : 0,
  ]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const related = await prisma.product.findMany({ where: { active: true, categoryId: p.categoryId, id: { not: p.id } }, take: 4, include: { brand: true } });
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const specs = Object.entries((p.specs ?? {}) as Record<string, string>);
  const off = p.compareAtUsd && Number(p.compareAtUsd) > Number(p.priceUsd) ? Math.round(((Number(p.compareAtUsd) - Number(p.priceUsd)) / Number(p.compareAtUsd)) * 100) : 0;
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, description: p.description, image: p.images, brand: p.brand ? { "@type": "Brand", name: p.brand.name } : undefined,
    ...(reviews.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}),
    offers: { "@type": "Offer", priceCurrency: "USD", price: Number(p.priceUsd), availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="hover:text-navy">Inicio</Link><Icon name="chevronRight" size={12} />
        <Link href="/catalogo" className="hover:text-navy">Catálogo</Link><Icon name="chevronRight" size={12} />
        <Link href={`/catalogo?categoria=${p.category.slug}`} className="hover:text-navy">{p.category.name}</Link><Icon name="chevronRight" size={12} />
        <span className="text-slate-500">{p.name}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          {p.model3dUrl ? <ModelViewer src={p.model3dUrl} alt={p.name} poster={p.images[0]} /> : <ProductGallery images={p.images} name={p.name} has3d={false} />}
          {p.model3dUrl && p.images.length > 0 && <ProductGallery images={p.images} name={p.name} has3d />}
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/catalogo?categoria=${p.category.slug}`} className="badge bg-[color:var(--color-navy)]/8 text-[color:var(--color-accent-deep)]">{p.category.name}</Link>
            {p.brand && <span className="badge bg-slate-100 text-slate-600">{p.brand.name}</span>}
            {off > 0 && <span className="badge bg-[color:var(--color-volt)] text-[color:var(--color-navy-deep)]">-{off}%</span>}
            {p.featured && <span className="badge bg-[color:var(--color-navy)] text-white">Destacado</span>}
          </div>

          <h1 className="font-display text-3xl font-extrabold leading-tight text-navy">{p.name}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {reviews.length > 0 ? (
              <span className="flex items-center gap-1.5"><span className="text-amber-500">{"★".repeat(Math.round(avg))}<span className="text-slate-300">{"★".repeat(5 - Math.round(avg))}</span></span><b>{avg.toFixed(1)}</b><span className="text-slate-400">({reviews.length} valoraciones)</span></span>
            ) : <span className="text-slate-400">Sé el primero en valorarlo</span>}
            <span className="font-mono text-xs text-slate-400">Código {p.sku}</span>
          </div>

          {p.compareAtUsd && Number(p.compareAtUsd) > Number(p.priceUsd) && p.variants.length === 0 && (
            <p className="flex items-baseline gap-2"><s className="text-lg text-slate-400">{Number(p.compareAtUsd).toFixed(2)} USD</s></p>
          )}

          <div className="card p-5">
            <AddToCart productId={p.id} stock={p.stock} basePriceUsd={Number(p.priceUsd)} variants={p.variants.map((v) => ({ id: v.id, name: v.name, priceUsd: v.priceUsd != null ? Number(v.priceUsd) : null, stock: v.stock }))} />
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <WishlistButton productId={p.id} initial={inWish > 0} />
              <CompareToggle productId={p.id} />
              {wa && <a className="btn btn-ghost !text-[color:var(--color-ok)]" target="_blank" rel="noopener" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, consulta sobre: ${p.name} (${p.sku})`)}`}><Icon name="whatsapp" size={18} /> Consultar</a>}
            </div>
          </div>

          <p className="leading-relaxed text-slate-600">{p.description}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[["truck", "Entrega en toda Cuba"], ["shield", "Garantía del vendedor"], ["card", "Pago en línea seguro"]].map(([ic, t]) => (
              <div key={t} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 text-xs font-medium text-slate-600"><Icon name={ic} size={18} className="shrink-0 text-[color:var(--color-accent-deep)]" />{t}</div>
            ))}
          </div>

          {p.fits.length > 0 && (
            <div className="card p-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy"><Icon name="car" size={16} /> Compatible con</h3>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {p.fits.map((f) => <li key={f.id} className="chip">{f.make} {f.model} <span className="font-mono text-[10px] text-slate-400">{f.yearFrom}–{f.yearTo}</span></li>)}
              </ul>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><Icon name="info" size={13} /> Compatibilidad según los datos del vendedor; confirma antes de comprar.</p>
            </div>
          )}

          {specs.length > 0 && (
            <div className="card overflow-hidden">
              <h3 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-display text-sm font-bold text-navy"><Icon name="ruler" size={16} /> Especificaciones técnicas</h3>
              <table className="w-full text-sm"><tbody>{specs.map(([k, v]) => <tr key={k} className="border-b border-slate-50 last:border-0"><td className="px-4 py-2 font-medium text-slate-500">{k}</td><td className="px-4 py-2 text-slate-700">{v}</td></tr>)}</tbody></table>
            </div>
          )}
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-extrabold text-navy">Valoraciones</h2>
          {reviews.length > 0 && <span className="badge bg-amber-100 text-amber-700">{avg.toFixed(1)} ★ · {reviews.length}</span>}
        </div>
        <div className="mt-4 grid gap-3 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4 text-sm">
              <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-navy)]/8 font-display text-xs font-bold text-navy">{r.customer.name.slice(0, 1)}</span><b>{r.customer.name.split(" ")[0]}</b><span className="ml-auto text-amber-500">{"★".repeat(r.rating)}</span></div>
              <p className="mt-2 text-slate-600">{r.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-slate-500">Aún no hay valoraciones.</p>}
        </div>
        {bought > 0 && <div className="mt-4"><ReviewForm productId={p.id} /></div>}
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-extrabold text-navy">Productos relacionados</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
