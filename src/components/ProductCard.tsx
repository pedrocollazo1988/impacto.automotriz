import Link from "next/link";
import Image from "next/image";
import Icon from "@/components/brand/Icon";

export type CardProduct = {
  slug: string; name: string; priceUsd: unknown; compareAtUsd?: unknown; stock: number; images: string[];
  brand?: { name: string } | null; sku?: string; createdAt?: Date | string;
};

function discountPct(price: unknown, compare: unknown) {
  const p = Number(price), c = Number(compare);
  if (!c || c <= p) return 0;
  return Math.round(((c - p) / c) * 100);
}

export default function ProductCard({ p }: { p: CardProduct }) {
  const img = p.images[0] ?? "/placeholder.svg";
  const off = discountPct(p.priceUsd, p.compareAtUsd);
  const low = p.stock > 0 && p.stock <= 3;
  return (
    <Link href={`/producto/${p.slug}`} className="group card card-hover relative flex flex-col overflow-hidden">
      <div className="relative aspect-[4/3] overflow-hidden bg-gradient-to-br from-slate-100 to-slate-200">
        <Image src={img} alt={p.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover transition-transform duration-500 group-hover:scale-[1.06]" unoptimized={img.endsWith(".svg")} />
        <div className="absolute left-2 top-2 flex flex-col items-start gap-1">
          {off > 0 && <span className="badge bg-[color:var(--color-volt)] text-[color:var(--color-navy-deep)] shadow">-{off}%</span>}
          {p.stock <= 0 && <span className="badge bg-slate-900/85 text-white">Agotado</span>}
          {low && <span className="badge bg-white/90 text-amber-700">Últimas {p.stock}</span>}
        </div>
        <span className="pointer-events-none absolute inset-0 -translate-y-full bg-gradient-to-t from-navy/70 via-navy/10 to-transparent opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100" />
        <span className="absolute bottom-2 right-2 translate-y-3 opacity-0 transition-all duration-300 group-hover:translate-y-0 group-hover:opacity-100">
          <span className="badge flex items-center gap-1 bg-white/95 text-navy shadow"><Icon name="cube" size={12} /> Ver ficha</span>
        </span>
      </div>
      <div className="flex flex-1 flex-col p-3.5">
        {p.brand?.name && <span className="eyebrow mb-1 !text-[10px] text-slate-400">{p.brand.name}</span>}
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug text-slate-800 transition group-hover:text-navy">{p.name}</h3>
        <div className="mt-auto pt-3">
          <div className="flex items-end gap-2">
            <span className="font-display text-lg font-extrabold text-navy">{Number(p.priceUsd).toFixed(2)} <span className="text-xs font-bold text-slate-500">USD</span></span>
            {off > 0 && <s className="pb-0.5 text-xs text-slate-400">{Number(p.compareAtUsd).toFixed(2)}</s>}
          </div>
          <p className={`mt-1 flex items-center gap-1 text-xs font-medium ${p.stock > 0 ? "text-[color:var(--color-ok)]" : "text-red-600"}`}>
            <span className={`inline-block h-1.5 w-1.5 rounded-full ${p.stock > 0 ? "bg-[color:var(--color-ok)]" : "bg-red-500"}`} />
            {p.stock > 0 ? "Disponible" : "Agotado"}
          </p>
        </div>
      </div>
    </Link>
  );
}
