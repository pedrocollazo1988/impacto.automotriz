import Link from "next/link";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/brand/Icon";

export const metadata = { title: "Novedades" };
export const dynamic = "force-dynamic";

export default async function Novedades() {
  const productos = await prisma.product.findMany({
    where: { active: true },
    orderBy: { createdAt: "desc" },
    take: 16,
    include: { brand: true, category: { select: { slug: true, name: true } } },
  });

  return (
    <div>
      <section className="relative overflow-hidden bg-[color:var(--color-navy-deep)] text-white">
        <div aria-hidden className="absolute inset-0 blueprint opacity-60" />
        <div className="container-x relative py-14">
          <span className="eyebrow eyebrow-light">Recién llegado</span>
          <h1 className="mt-2 font-display text-4xl font-extrabold leading-tight">Novedades</h1>
          <p className="mt-4 max-w-2xl text-lg text-white/75">
            Lo último que ha entrado en el almacén. Ordenado por fecha de alta,
            para que veas antes que nadie lo que ya está disponible.
          </p>
        </div>
      </section>

      <section className="container-x py-12">
        {productos.length === 0 ? (
          <div className="card p-10 text-center">
            <Icon name="box" size={40} className="mx-auto text-slate-300" />
            <h2 className="mt-3 font-display text-lg font-bold text-navy">Sin novedades por ahora</h2>
            <p className="mt-1 text-sm text-slate-500">Cuando entre stock nuevo aparecerá aquí.</p>
            <Link href="/catalogo" className="btn btn-primary mt-5">Ver catálogo</Link>
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 md:grid-cols-3 lg:grid-cols-4">
            {productos.map((p) => <ProductCard key={p.id} p={p} />)}
          </div>
        )}
      </section>
    </div>
  );
}
