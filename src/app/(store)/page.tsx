import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
export const dynamic = "force-dynamic";

export default async function Home() {
  const [featured, categories] = await Promise.all([
    prisma.product.findMany({ where: { active: true, featured: true }, take: 8, orderBy: { id: "desc" } }),
    prisma.category.findMany({ orderBy: { name: "asc" } }),
  ]);
  const input = "rounded-lg border px-3 py-2 text-sm text-slate-800";
  return (
    <div className="space-y-10">
      <section className="rounded-2xl bg-navy p-8 text-white">
        <h1 className="text-3xl font-bold">La pieza correcta para tu vehículo</h1>
        <p className="mt-1 text-white/80">Busca por marca, modelo y año, mira la pieza en 3D y recibe en tu provincia.</p>
        <form action="/catalogo" className="mt-5 grid gap-2 sm:grid-cols-4">
          <input name="make" placeholder="Marca (Toyota)" className={input} /><input name="model" placeholder="Modelo (Corolla)" className={input} />
          <input name="year" type="number" placeholder="Año" className={input} /><button className="rounded-lg bg-white px-4 py-2 font-semibold text-navy">Buscar piezas</button>
        </form>
      </section>
      <section className="flex flex-wrap gap-2">{categories.map((c) => <a key={c.id} href={`/catalogo?categoria=${c.slug}`} className="rounded-full border px-4 py-1.5 text-sm hover:bg-slate-50">{c.name}</a>)}</section>
      <section><h2 className="mb-3 text-xl font-bold text-navy">Destacados</h2>
        <div className="grid grid-cols-2 gap-4 md:grid-cols-4">{featured.map((p) => <ProductCard key={p.id} p={p} />)}</div></section>
    </div>
  );
}
