import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getDiagram } from "@/lib/despiece";
import Icon from "@/components/brand/Icon";
import DespieceViewer from "@/components/despiece/DespieceViewer";
import { getT } from "@/lib/i18n";
import { enContenido } from "@/lib/contenido-en";
import { nombreProducto } from "@/lib/datos-i18n";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ vehiculo: string; sistema: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t, lang } = await getT();
  const { vehiculo, sistema } = await params;
  const d = await getDiagram(vehiculo, sistema);
  if (!d) return {};
  const sistemaEn = enContenido(d.system.name, lang);
  return {
    title: t("parts.systemMeta")
      .replace("{system}", sistemaEn)
      .replace("{brand}", d.vehicle.brand)
      .replace("{model}", d.vehicle.model),
    description: t("parts.systemMetaDesc")
      .replace("{n}", String(d.pins.length))
      .replace("{system}", sistemaEn.toLowerCase())
      .replace("{brand}", d.vehicle.brand)
      .replace("{model}", d.vehicle.model),
  };
}

export default async function LaminaDespiece({ params }: Props) {
  const { t, lang } = await getT();
  const { vehiculo, sistema } = await params;
  const d = await getDiagram(vehiculo, sistema);
  if (!d) notFound();
  const sistemaEn = enContenido(d.system.name, lang);

  // Datos estructurados: cada pieza es un producto comprable indexable por SKU.
  const ld = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: t("parts.ldName")
      .replace("{brand}", d.vehicle.brand)
      .replace("{model}", d.vehicle.model)
      .replace("{system}", sistemaEn),
    numberOfItems: d.pins.length,
    itemListElement: d.pins.map((p, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Product",
        name: nombreProducto(p.product, lang),
        sku: p.product.sku,
        offers: { "@type": "Offer", price: p.product.priceUsd.toFixed(2), priceCurrency: "USD", availability: p.product.stock > 0 ? "https://schema.org/InStock" : "https://schema.org/OutOfStock" },
      },
    })),
  };

  return (
    <div className="container-x py-8">
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(ld).replace(/</g, "\\u003c") }} />

      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-400">
        <Link href="/despiece" className="hover:text-navy">{t("nav.despiece")}</Link><Icon name="chevronRight" size={12} />
        <Link href={`/despiece/${d.vehicle.slug}`} className="hover:text-navy">{d.vehicle.brand} {d.vehicle.model}</Link><Icon name="chevronRight" size={12} />
        <span className="text-slate-500">{sistemaEn}</span>
      </nav>

      <header className="mb-5">
        <h1 className="font-display text-2xl font-extrabold leading-tight text-navy sm:text-3xl">
          {enContenido(d.diagram.title, lang)}
        </h1>
        <p className="mt-1 text-sm text-slate-500">
          {d.vehicle.brand} {d.vehicle.model} · {enContenido(d.vehicle.version, lang)}
          {d.vehicle.voltage ? ` · ${d.vehicle.voltage}` : ""} — {t("parts.numberedPieces").replace("{n}", String(d.pins.length))}
        </p>
      </header>

      <div className="mb-5 flex gap-1.5 overflow-x-auto pb-1">
        {d.siblings.map((s) => (
          <Link
            key={s.slug}
            href={`/despiece/${d.vehicle.slug}/${s.slug}`}
            aria-current={s.slug === d.system.slug ? "page" : undefined}
            className={`chip shrink-0 ${s.slug === d.system.slug ? "chip-active" : ""}`}
          >
            <Icon name={s.icon} size={12} /> {enContenido(s.name, lang)}
            <span className="font-mono text-[10px] opacity-70">{s.count}</span>
          </Link>
        ))}
      </div>

      <DespieceViewer vehicleSlug={d.vehicle.slug} image={d.diagram.image} pins={d.pins} />

      {d.diagram.notes && (
        <p className="mt-6 flex items-start gap-2 rounded-xl border border-slate-200 bg-slate-50 p-3 text-xs leading-relaxed text-slate-600">
          <Icon name="info" size={14} className="mt-0.5 shrink-0 text-[color:var(--color-action)]" />
          <span><b className="text-navy">{t("parts.techNote")}</b> {enContenido(d.diagram.notes, lang)}</span>
        </p>
      )}

      <p className="mt-4 flex items-center gap-2 text-xs text-slate-500">
        <Icon name="shield" size={14} className="text-[color:var(--color-ok)]" />
        {t("parts.connectorTip")}
      </p>
    </div>
  );
}
