import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/brand/Icon";
export const dynamic = "force-dynamic";
export const metadata = { title: "Ofertas y precios rebajados" };

export default async function Ofertas() {
  const products = await prisma.product.findMany({ where: { active: true, compareAtUsd: { not: null } }, orderBy: { id: "desc" }, take: 48, include: { brand: true } });
  return (
    <div>
      <section className="relative overflow-hidden bg-gradient-to-br from-[color:var(--color-navy)] to-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light inline-flex items-center gap-2"><Icon name="tag" size={14} /> Ahorra en tus piezas</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold">Ofertas del momento</h1>
          <p className="mt-3 max-w-2xl text-white/75">Precios rebajados por tiempo limitado en partes, piezas y accesorios. Aprovecha antes de que se agoten.</p>
        </div>
      </section>
      <section className="container-x py-10">
        {products.length ? (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
        ) : (
          <div className="card grid place-items-center p-12 text-center">
            <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="tag" size={26} /></span>
            <h2 className="mt-4 font-display text-lg font-bold text-navy">Aún no hay ofertas activas</h2>
            <p className="mt-1 max-w-sm text-sm text-slate-500">Vuelve pronto o explora el catálogo completo mientras tanto.</p>
            <Link href="/catalogo" className="btn btn-primary mt-4">Ver catálogo</Link>
          </div>
        )}
      </section>
    </div>
  );
}
