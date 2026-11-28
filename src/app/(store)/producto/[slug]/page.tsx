import Link from "next/link";
import Image from "next/image";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { getProductPageCached, getProductReviewsCached, getRelatedProductsCached } from "@/lib/product-page";
import AddToCart from "@/components/AddToCart";
import ProductViewer from "@/components/ProductViewer";
import ProductCard from "@/components/ProductCard";
import WishlistButton from "@/components/WishlistButton";
import CompareToggle from "@/components/CompareToggle";
import ReviewForm from "@/components/ReviewForm";
import Icon from "@/components/brand/Icon";
import { getCustomer } from "@/lib/customer-auth";
import { fotos360 } from "@/lib/photo360";
import { tieneVista360 } from "@/lib/vista360";
import { esVista, type Vista } from "@/lib/viewer";
import { waHref } from "@/lib/site";
import { getT } from "@/lib/i18n";
import { descripcionProducto, nombreCategoria, nombreMarca, nombreProducto, specsProducto } from "@/lib/datos-i18n";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ slug: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const [p, { lang }] = await Promise.all([getProductPageCached((await params).slug), getT()]);
  return p ? { title: nombreProducto(p, lang), description: descripcionProducto(p, lang).slice(0, 150), openGraph: { images: p.images.slice(0, 1) } } : {};
}

export default async function Producto({ params }: Props) {
  const [p, me] = await Promise.all([getProductPageCached((await params).slug), getCustomer()]);
  if (!p) notFound();
  const { t, lang } = await getT();
  const txt = (key: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t(key));

  prisma.product.update({ where: { id: p.id }, data: { views: { increment: 1 } } }).catch(() => {});
  // Reseñas y relacionados se cachean aparte; la sesión solo decide si el
  // cliente puede valorar o si ya tiene la pieza en deseos.
  const [reviews, inWish, bought, related] = await Promise.all([
    getProductReviewsCached(p.id),
    me ? prisma.wishlistItem.count({ where: { customerId: me.id, productId: p.id } }) : 0,
    me ? prisma.orderItem.count({ where: { productId: p.id, order: { customerId: me.id, status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } } }) : 0,
    getRelatedProductsCached(p.categoryId, p.id),
  ]);
  const avg = reviews.length ? reviews.reduce((s, r) => s + r.rating, 0) / reviews.length : 0;
  // Los fotogramas pueden venir del panel (subidos) o de la secuencia estática de
  // /public/products/360. Se prefiere la del panel: es la que el admin ve y edita.
  const frames = p.spin360Frames.length
    ? p.spin360Frames
    : tieneVista360(p.category.slug)
      ? fotos360(p.sku)
      : [];
  const vista: Vista = esVista(p.viewerMode) ? p.viewerMode : "photos";
  const nombre = nombreProducto(p, lang);
  const descripcion = descripcionProducto(p, lang);
  const categoria = nombreCategoria(p.category, lang);
  const marca = p.brand ? nombreMarca(p.brand, lang) : null;
  const specs = specsProducto(p, lang);
  const off = p.compareAtUsd && Number(p.compareAtUsd) > Number(p.priceUsd) ? Math.round(((Number(p.compareAtUsd) - Number(p.priceUsd)) / Number(p.compareAtUsd)) * 100) : 0;
  const ld = { "@context": "https://schema.org", "@type": "Product", name: nombre, sku: p.sku, description: descripcion, image: p.images, brand: marca ? { "@type": "Brand", name: marca } : undefined,
    ...(p.model3dUrl ? { subjectOf: { "@type": "3DModel", name: nombre, encoding: { "@type": "MediaObject", contentUrl: p.model3dUrl, encodingFormat: "model/gltf-binary" } } } : {}),
    ...(reviews.length ? { aggregateRating: { "@type": "AggregateRating", ratingValue: avg.toFixed(1), reviewCount: reviews.length } } : {}),
    offers: { "@type": "Offer", priceCurrency: "USD", price: Number(p.priceUsd), availability: p.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" } };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <Link href="/" className="inline-flex min-h-12 items-center hover:text-navy lg:min-h-0">{t("nav.home")}</Link><Icon name="chevronRight" size={12} />
        <Link href="/catalogo" className="hover:text-navy">{t("nav.catalogo")}</Link><Icon name="chevronRight" size={12} />
        <Link href={`/catalogo?categoria=${p.category.slug}`} className="hover:text-navy">{categoria}</Link><Icon name="chevronRight" size={12} />
        <span className="text-slate-500">{nombre}</span>
      </nav>

      <div className="grid gap-8 lg:grid-cols-2">
        <div className="space-y-4">
          <ProductViewer
            images={p.images}
            videos={p.videos}
            name={nombre}
            model3dUrl={p.model3dUrl}
            model3dVideo={p.model3dVideo}
            frames={frames}
            spin360Video={p.spin360Video}
            initial={vista}
          />
          {p.sku === "TE-4001" && (
            <p className="rounded-lg border border-slate-200 bg-slate-50 px-3 py-2 text-xs text-slate-500">
              {t("pdp.te4001Note")}
            </p>
          )}
        </div>

        <div className="space-y-5">
          <div className="flex flex-wrap items-center gap-2">
            <Link href={`/catalogo?categoria=${p.category.slug}`} className="badge bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]">{categoria}</Link>
            {marca && <span className="badge bg-slate-100 text-slate-600">{marca}</span>}
            {off > 0 && <span className="badge bg-[color:var(--color-action-hi)] text-[color:var(--color-navy-deep)]">-{off}%</span>}
            {p.featured && <span className="badge bg-[color:var(--color-navy)] text-white">{t("pdp.featured")}</span>}
          </div>

          <h1 className="font-display text-3xl font-extrabold leading-tight text-navy">{nombre}</h1>

          <div className="flex flex-wrap items-center gap-3 text-sm">
            {reviews.length > 0 ? (
              <span className="flex items-center gap-1.5"><span className="text-amber-500">{"★".repeat(Math.round(avg))}<span className="text-slate-300">{"★".repeat(5 - Math.round(avg))}</span></span><b>{avg.toFixed(1)}</b><span className="text-slate-400">{txt("pdp.reviewsCount", { n: reviews.length })}</span></span>
            ) : <span className="text-slate-400">{t("pdp.beFirst")}</span>}
            <span className="font-mono text-xs text-slate-400">{txt("pdp.sku", { sku: p.sku })}</span>
          </div>

          {p.compareAtUsd && Number(p.compareAtUsd) > Number(p.priceUsd) && p.variants.length === 0 && (
            <p className="flex items-baseline gap-2"><s className="text-lg text-slate-400">{Number(p.compareAtUsd).toFixed(2)} USD</s></p>
          )}

          <div className="card p-5">
            <AddToCart productId={p.id} stock={p.stock} basePriceUsd={Number(p.priceUsd)} authenticated={!!me} variants={p.variants.map((v) => ({ id: v.id, name: v.name, priceUsd: v.priceUsd != null ? Number(v.priceUsd) : null, stock: v.stock }))} />
            <div className="mt-4 flex flex-wrap items-center gap-3 border-t border-slate-100 pt-4">
              <WishlistButton productId={p.id} initial={inWish > 0} />
              <CompareToggle productId={p.id} />
              <a className="btn btn-ghost !text-emerald-700" target="_blank" rel="noopener" href={waHref(txt("pdp.waMessage", { name: nombre, sku: p.sku }))}><Icon name="whatsapp" size={18} /> {t("pdp.ask")}</a>
            </div>
          </div>

          <p className="leading-relaxed text-slate-600">{descripcion}</p>

          <div className="grid gap-3 sm:grid-cols-3">
            {[["truck", t("pdp.trustDelivery")], ["shield", t("pdp.trustWarranty")], ["card", t("pdp.trustPayment")]].map(([ic, texto]) => (
              <div key={texto} className="flex items-center gap-2 rounded-xl border border-slate-100 bg-white p-3 text-xs font-medium text-slate-600"><Icon name={ic} size={18} className="shrink-0 text-[color:var(--color-action-deep)]" />{texto}</div>
            ))}
          </div>

          {p.fits.length > 0 && (
            <div className="card p-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy"><Icon name="car" size={16} /> {t("pdp.fitsTitle")}</h3>
              <ul className="mt-2 flex flex-wrap gap-2 text-sm">
                {p.fits.map((f) => <li key={f.id} className="chip">{f.make} {f.model} <span className="font-mono text-[10px] text-slate-400">{f.yearFrom}–{f.yearTo}</span></li>)}
              </ul>
              <p className="mt-2 flex items-center gap-1.5 text-xs text-slate-400"><Icon name="info" size={13} /> {t("pdp.fitsNote")}</p>
            </div>
          )}

          {p.pins.length > 0 && (
            <div className="card p-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy"><Icon name="layers" size={16} /> {t("pdp.pinsTitle")}</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {p.pins.map((pin) => (
                  <li key={pin.id}>
                    <Link
                      href={`/despiece/${pin.diagram.vehicle.slug}/${pin.diagram.system.slug}?pieza=${p.sku}`}
                      className="flex items-center gap-2 text-[color:var(--color-action-deep)] hover:underline"
                    >
                      <span className="grid h-5 w-5 shrink-0 place-items-center rounded-full bg-[color:var(--color-navy)] font-mono text-[10px] font-bold text-white">{pin.number}</span>
                      {pin.diagram.vehicle.brand} {pin.diagram.vehicle.model} · {pin.diagram.system.name}
                      <Icon name="arrowRight" size={12} />
                    </Link>
                  </li>
                ))}
              </ul>
              <p className="mt-2 text-xs text-slate-400">{t("pdp.pinsNote")}</p>
            </div>
          )}

          {p.compatWith.length > 0 && (
            <div className="card p-4">
              <h3 className="flex items-center gap-2 font-display text-sm font-bold text-navy"><Icon name="check" size={16} /> {t("pdp.crossTitle")}</h3>
              <ul className="mt-2 space-y-1.5 text-sm">
                {p.compatWith.map((c) => (
                  <li key={c.id}>
                    <Link href={`/producto/${c.target.slug}`} className="font-semibold text-[color:var(--color-action-deep)] hover:underline">{nombreProducto(c.target, lang)}</Link>
                    <span className="font-mono text-[11px] text-slate-400"> · {c.target.sku}</span>
                    {c.note && <p className="text-xs text-slate-500">{c.note}</p>}
                  </li>
                ))}
              </ul>
            </div>
          )}

          {p.connectorImage && (
            <div className="card overflow-hidden">
              <h3 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-display text-sm font-bold text-navy"><Icon name="bolt" size={16} /> {t("pdp.connectorsTitle")}</h3>
              <Image src={p.connectorImage} alt={txt("pdp.connectorsAlt", { name: nombre })} width={800} height={800} sizes="(max-width:1024px) 100vw, 40vw" className="h-auto w-full bg-slate-50 object-contain" unoptimized={!p.connectorImage.startsWith("/") || p.connectorImage.endsWith(".svg")} />
              <p className="px-4 py-2 text-xs text-slate-500">{t("pdp.connectorsNote")}</p>
            </div>
          )}

          {specs.length > 0 && (
            <div className="card overflow-hidden">
              <h3 className="flex items-center gap-2 border-b border-slate-100 px-4 py-3 font-display text-sm font-bold text-navy"><Icon name="ruler" size={16} /> {t("pdp.specsTitle")}</h3>
              <table className="w-full text-sm"><tbody>{specs.map(([k, v]) => <tr key={k} className="border-b border-slate-50 last:border-0"><td className="px-4 py-2 font-medium text-slate-500">{k}</td><td className="px-4 py-2 text-slate-700">{v}</td></tr>)}</tbody></table>
            </div>
          )}
        </div>
      </div>

      <section className="mt-12">
        <div className="flex items-center gap-3">
          <h2 className="font-display text-xl font-extrabold text-navy">{t("pdp.reviewsTitle")}</h2>
          {reviews.length > 0 && <span className="badge bg-amber-100 text-amber-700">{avg.toFixed(1)} ★ · {reviews.length}</span>}
        </div>
        <div className="mt-4 grid gap-4 md:grid-cols-2">
          {reviews.map((r) => (
            <div key={r.id} className="card p-4 text-sm">
              <div className="flex items-center gap-2"><span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-navy)]/8 font-display text-xs font-bold text-navy">{r.customer.name.slice(0, 1)}</span><b>{r.customer.name.split(" ")[0]}</b><span className="ml-auto text-amber-500">{"★".repeat(r.rating)}</span></div>
              <p className="mt-2 text-slate-600">{r.comment}</p>
            </div>
          ))}
          {reviews.length === 0 && <p className="text-sm text-slate-500">{t("pdp.noReviews")}</p>}
        </div>
        {bought > 0 && <div className="mt-4"><ReviewForm productId={p.id} /></div>}
      </section>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="font-display text-xl font-extrabold text-navy">{t("pdp.relatedTitle")}</h2>
          <div className="mt-4 grid grid-cols-2 gap-4 md:grid-cols-4">{related.map((r) => <ProductCard key={r.id} p={r} />)}</div>
        </section>
      )}
    </div>
  );
}
