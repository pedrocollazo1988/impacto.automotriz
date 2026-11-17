import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import ProductCard from "@/components/ProductCard";
import { getCustomer } from "@/lib/customer-auth";
export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogo" };

type SP = Promise<Record<string, string | undefined>>;
export default async function Catalogo({ searchParams }: { searchParams: SP }) {
  const s = await searchParams;
  const me = await getCustomer();
  const garage = me ? await prisma.garageVehicle.findMany({ where: { customerId: me.id } }) : [];
  const year = s.year ? Number(s.year) : undefined;
  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(s.q ? { OR: [{ name: { contains: s.q, mode: "insensitive" } }, { sku: { contains: s.q, mode: "insensitive" } }] } : {}),
    ...(s.categoria ? { category: { slug: s.categoria } } : {}),
    ...(s.marca ? { brand: { slug: s.marca } } : {}),
    ...(s.make || s.model || year ? { fits: { some: {
      ...(s.make ? { make: { contains: s.make, mode: "insensitive" as const } } : {}),
      ...(s.model ? { model: { contains: s.model, mode: "insensitive" as const } } : {}),
      ...(year ? { yearFrom: { lte: year }, yearTo: { gte: year } } : {}),
    } } } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput = s.orden === "precio" ? { priceUsd: "asc" } : s.orden === "precio-desc" ? { priceUsd: "desc" } : { id: "desc" };
  const [products, categories, brands] = await Promise.all([
    prisma.product.findMany({ where, orderBy, take: 48 }), prisma.category.findMany({ orderBy: { name: "asc" } }), prisma.brand.findMany({ orderBy: { name: "asc" } }),
  ]);
  const link = (o: Record<string, string | undefined>) => `/catalogo?${new URLSearchParams(Object.entries({ ...s, ...o }).filter(([, v]) => v) as [string, string][])}`;
  return (
    <div className="grid gap-6 md:grid-cols-[220px_1fr]">
      <aside className="space-y-5 text-sm">
        <div><h3 className="mb-1 font-semibold text-navy">Categorías</h3>{categories.map((c) => <Link key={c.id} href={link({ categoria: c.slug })} className={`block py-0.5 ${s.categoria === c.slug ? "font-bold" : ""}`}>{c.name}</Link>)}</div>
        <div><h3 className="mb-1 font-semibold text-navy">Marcas</h3>{brands.map((b) => <Link key={b.id} href={link({ marca: b.slug })} className={`block py-0.5 ${s.marca === b.slug ? "font-bold" : ""}`}>{b.name}</Link>)}</div>
        <div><h3 className="mb-1 font-semibold text-navy">Ordenar</h3><Link href={link({ orden: "precio" })} className="block">Precio ↑</Link><Link href={link({ orden: "precio-desc" })} className="block">Precio ↓</Link><Link href="/catalogo" className="mt-2 block text-slate-500">Quitar filtros</Link></div>
      </aside>
      <section>{garage.length > 0 && <div className="mb-4 flex flex-wrap items-center gap-2 text-sm"><span className="text-slate-500">Mi garaje:</span>{garage.map((g) => <Link key={g.id} href={link({ make: g.make, model: g.model, year: String(g.year) })} className="rounded-full border px-3 py-1 hover:bg-slate-50">{g.make} {g.model} {g.year}</Link>)}</div>}{products.length ? <div className="grid grid-cols-2 gap-4 lg:grid-cols-3">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div> : <p className="text-slate-500">No encontramos piezas con esos filtros.</p>}</section>
    </div>
  );
}
