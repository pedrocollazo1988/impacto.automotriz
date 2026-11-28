import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/brand/Icon";
import CardVideo from "@/components/CardVideo";
import { tieneVista360 } from "@/lib/vista360";
import { fotos360 } from "@/lib/photo360";
import { getT } from "@/lib/i18n";

export type CardProduct = {
  slug: string; name: string; priceUsd: unknown; compareAtUsd?: unknown; stock: number; images: string[]; videos?: string[];
  brand?: { name: string } | null; sku?: string; createdAt?: Date | string;
  category?: { slug: string; name?: string } | null;
};

function discountPct(price: unknown, compare: unknown) {
  const p = Number(price), c = Number(compare);
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

// `priority` solo para las tarjetas de la primera fila: son la imagen más grande
// del pliegue y, en `next/image`, lo demás va con carga diferida (si el LCP está
// en diferido, se retrasa hasta que el navegador lo descubre).
export default async function ProductCard({ p, priority = false }: { p: CardProduct; priority?: boolean }) {
  const { t } = await getT();
  const img = p.images[0] ?? "/placeholder.svg";
  // El vídeo manda si existe: enseña la pieza en movimiento en la propia parrilla.
  // Sin foto de portada se usa igualmente, con el vídeo como póster de respaldo.
  const video = p.videos?.find(Boolean);
  const off = discountPct(p.priceUsd, p.compareAtUsd);
  const low = p.stock > 0 && p.stock <= 3;
  return (
    <Link href={`/producto/${p.slug}`} className="group card card-hover relative flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        {video ? (
          <CardVideo src={video} poster={img} alt={p.name} />
        ) : (
          <Image src={img} alt={p.name} fill sizes="(max-width:768px) calc(50vw - 1.5rem), (max-width:1024px) calc(33vw - 1.5rem), calc(25vw - 1.5rem)" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" unoptimized={img.endsWith(".svg")} priority={priority} />
        )}
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && <span className="badge bg-[color:var(--color-action-hi)] text-[color:var(--color-navy-deep)] shadow">-{off}%</span>}
          {p.stock <= 0 && <span className="badge bg-slate-900/85 text-white">{t("card.outOfStock")}</span>}
          {low && <span className="badge bg-white/90 text-amber-700">{t("card.lowStock")} {p.stock}</span>}
        </div>
        {tieneVista360(p.category?.slug) && fotos360(p.sku).length > 0 && (
          <span className="badge absolute right-2 top-2 flex items-center gap-1 bg-[color:var(--color-navy)]/90 text-white shadow" title={t("card.spin360")}>
            <Icon name="cube" size={12} /> 360°
          </span>
        )}
        <span className="pointer-events-none absolute inset-0 -translate-y-full bg-gradient-to-t from-navy/70 via-navy/10 to-transparent opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
        <span className="absolute bottom-2 right-2 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="badge flex items-center gap-1 bg-white/95 text-navy shadow"><Icon name="cube" size={12} /> {t("card.view")}</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        <span className="eyebrow mb-1 !text-[10px] text-slate-500">{p.category?.name ?? p.brand?.name ?? t("card.fallbackCategory")}</span>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition group-hover:text-navy">{p.name}</h3>
        <div className="mt-auto pt-3">
          <div className="flex items-end gap-2">
            <span className="font-display text-lg font-extrabold text-navy">{Number(p.priceUsd).toFixed(2)} <span className="text-xs font-bold text-slate-500">USD</span></span>
            {off > 0 && <s className="pb-0.5 text-xs text-slate-500">{Number(p.compareAtUsd).toFixed(2)}</s>}
          </div>
          <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${p.stock > 0 ? "text-emerald-700" : "text-red-600"}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${p.stock > 0 ? "bg-[color:var(--color-ok)]" : "bg-red-500"}`} />
            {p.stock > 0 ? t("card.inStock") : t("card.outOfStock")}
          </p>
        </div>
      </div>
    </Link>
  );
}
