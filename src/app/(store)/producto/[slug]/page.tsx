import Image from "next/image";
import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import AddToCart from "@/components/AddToCart";
import ModelViewer from "@/components/ModelViewer";
import ProductCard from "@/components/ProductCard";
import WishlistButton from "@/components/WishlistButton";
import CompareToggle from "@/components/CompareToggle";
import ReviewForm from "@/components/ReviewForm";
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
  prisma.product.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => {}); // contador de vistas
  const me = await getCustomer();
  const [reviews, inWish, bought] = await Promise.all([
    prisma.review.findMany({ where: { productId: p.id, visible: true }, orderBy: { id: "desc" }, take: 20, include: { customer: { select: { name: true } } } }),
    me ? prisma.wishlistItem.count({ where: { customerId: me.id, productId: p.id } }) : 0,
    me ? prisma.orderItem.count({ where: { productId: p.id, order: { customerId: me.id, status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } } }) : 0,
  ]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  const related = await prisma.product.findMany({ where: { active: true, categoryId: p.categoryId, id: { not: p.id } }, take: 4 });
  const wa = process.env.NEXT_PUBLIC_WHATSAPP;
  const specs = Object.entries((p.specs ?? {}) as Record<string, string>);
  const ld = { "@context": "https://schema.org", "@type": "Product", name: p.name, sku: p.sku, description: p.description, image: p.images, brand: p.brand ? { "@type": "Brand", name: p.brand.name } : undefined,
    ...(reviews.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}),
    offers: { "@type": "Offer", priceCurrency: "USD", price: Number(p.priceUsd), availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } };
  return (
    <div className="space-y-10">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />
      <div className="grid gap-8 md:grid-cols-2">
        <div className="space-y-3">
          {p.model3dUrl ? <ModelViewer src={p.model3dUrl} alt={p.name} poster={p.images[0]} />
            : <div className="relative aspect-[4/3] overflow-hidden rounded-xl bg-slate-100"><Image src={p.images[0] ?? "/placeholder.svg"} alt={p.name} fill className="object-cover" unoptimized={(p.images[0] ?? "/placeholder.svg").endsWith(".svg")} /></div>}
          {p.images.length > 1 && <div className="flex gap-2">{p.images.slice(1, 5).map((u) => <div key={u} className="relative h-16 w-16 overflow-hidden rounded border"><Image src={u} alt="" fill className="object-cover" /></div>)}</div>}
        </div>
        <div className="space-y-4">
          <p className="text-sm text-slate-500"><Link href={`/catalogo?categoria=${p.category.slug}`}>{p.category.name}</Link>{p.brand && ` · ${p.brand.name}`} · Código {p.sku}</p>
          <h1 className="text-2xl font-bold text-navy">{p.name}</h1>
          {p.variants.length === 0 && <p className="text-3xl font-bold">{Number(p.priceUsd).toFixed(2)} USD</p>}
          <p className="text-slate-600">{p.description}</p>
          <AddToCart productId={p.id} stock={p.stock} basePriceUsd={Number(p.priceUsd)} variants={p.variants.map((v) => ({ id: v.id, name: v.name, priceUsd: v.priceUsd != null ? Number(v.priceUsd) : null, stock: v.stock }))} />
          <div className="flex flex-wrap items-center gap-3"><WishlistButton productId={p.id} initial={inWish > 0} /><CompareToggle productId={p.id} /></div>
          {wa && <a className="inline-block text-sm font-medium text-green-700 underline" target="_blank" rel="noopener" href={`https://wa.me/${wa}?text=${encodeURIComponent(`Hola, consulta sobre: ${p.name} (${p.sku})`)}`}>Consultar por WhatsApp</a>}
          {p.fits.length > 0 && <div><h3 className="font-semibold text-navy">Compatible con</h3><ul className="text-sm text-slate-600">{p.fits.map((f) => <li key={f.id}>{f.make} {f.model} ({f.yearFrom}–{f.yearTo})</li>)}</ul><p className="text-xs text-slate-400">Compatibilidad según los datos del vendedor; confirma antes de comprar.</p></div>}
          {specs.length > 0 && <table className="w-full text-sm"><tbody>{specs.map(([k, v]) => <tr key={k} className="border-t"><td className="py-1 font-medium">{k}</td><td>{v}</td></tr>)}</tbody></table>}
        </div>
      </div>
      <section className="space-y-3"><h2 className="text-xl font-bold text-navy">Valoraciones{reviews.length > 0 && ` · ${avg.toFixed(1)} ★ (${reviews.length})`}</h2>
        {reviews.map((r) => <div key={r.id} className="rounded-lg border p-3 text-sm"><b>{r.customer.name.split(" ")[0]}</b> <span className="text-amber-500">{"★".repeat(r.rating)}</span><p>{r.comment}</p></div>)}
        {reviews.length === 0 && <p className="text-sm text-slate-500">Aún no hay valoraciones.</p>}
        {bought > 0 && <ReviewForm productId={p.id} />}</section>
      {related.length > 0 && <section><h2 className="mb-3 text-xl font-bold text-navy">Productos relacionados</h2><div className="grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div></section>}
    </div>
  );
}
