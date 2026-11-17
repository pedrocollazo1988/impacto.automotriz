import Link from "next/link";
import Image from "next/image";

export default function ProductCard({ p }: { p: { slug: string; name: string; priceUsd: unknown; stock: number; images: string[]; compareAtUsd?: unknown } }) {
  const img = p.images[0] ?? "/placeholder.svg";
  return (
    <Link href={`/producto/${p.slug}`} className="group block overflow-hidden rounded-xl border transition hover:shadow-md">
      <div className="relative aspect-[4/3] bg-slate-100"><Image src={img} alt={p.name} fill sizes="(max-width:768px) 50vw, 25vw" className="object-cover" unoptimized={img.endsWith(".svg")} /></div>
      <div className="p-3">
        <h3 className="line-clamp-2 text-sm font-medium group-hover:text-navy">{p.name}</h3>
        <p className="mt-1 font-bold text-navy">{Number(p.priceUsd).toFixed(2)} USD {p.compareAtUsd ? <s className="ml-1 text-xs font-normal text-slate-400">{Number(p.compareAtUsd).toFixed(2)}</s> : null}</p>
        <p className={`text-xs ${p.stock > 0 ? "text-green-700" : "text-red-600"}`}>{p.stock > 0 ? "Disponible" : "Agotado"}</p>
      </div>
    </Link>
  );
}
