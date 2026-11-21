import Link from "next/link";
import type { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";
import { getBrandsCached, getCategoriesCached } from "@/lib/catalog";
import ProductCard from "@/components/ProductCard";
import Icon from "@/components/brand/Icon";
import { getCustomer } from "@/lib/customer-auth";
import { searchProductIds } from "@/lib/catalog";
import { skusConGiro } from "@/lib/photo360";

const OPCIONES_OTROS = [
  ["disponible", "Solo disponibles"],
  ["oferta", "Solo en oferta"],
  ["vista3d", "Se puede girar 360°"],
] as const;

export const dynamic = "force-dynamic";
export const metadata = { title: "Catálogo de piezas y accesorios" };

type SP = Promise<Record<string, string | undefined>>;

const ORDENES: [string, string][] = [["novedad", "Más recientes"], ["precio", "Precio: menor a mayor"], ["precio-desc", "Precio: mayor a menor"], ["popular", "Más vistos"]];

export default async function Catalogo({ searchParams }: { searchParams: SP }) {
  const s = await searchParams;
  const me = await getCustomer();
  const garage = me ? await prisma.garageVehicle.findMany({ where: { customerId: me.id } }) : [];
  const year = s.year ? Number(s.year) : undefined;
  const min = s.min ? Number(s.min) : undefined;
  const max = s.max ? Number(s.max) : undefined;
  const searchIds = s.q?.trim() ? await searchProductIds(s.q.trim()) : null;

  const where: Prisma.ProductWhereInput = {
    active: true,
    ...(searchIds ? { id: { in: searchIds.length ? searchIds : [-1] } } : {}),
    ...(s.categoria ? { category: { slug: s.categoria } } : {}),
    ...(s.marca ? { brand: { slug: s.marca } } : {}),
    ...(s.disponible === "1" ? { stock: { gt: 0 } } : {}),
    ...(s.oferta === "1" ? { compareAtUsd: { not: null } } : {}),
    // Solo los SKU con secuencia de fotos real: filtrar por categoría prometía
  // giro en vehículos que la ficha muestra quietos.
  ...(s.vista3d === "1" ? { sku: { in: skusConGiro() } } : {}),
    ...(min !== undefined || max !== undefined ? { priceUsd: { ...(min !== undefined ? { gte: min } : {}), ...(max !== undefined ? { lte: max } : {}) } } : {}),
    ...(s.make || s.model || year ? { fits: { some: {
      ...(s.make ? { make: { contains: s.make, mode: "insensitive" as const } } : {}),
      ...(s.model ? { model: { contains: s.model, mode: "insensitive" as const } } : {}),
      ...(year ? { yearFrom: { lte: year }, yearTo: { gte: year } } : {}),
    } } } : {}),
  };
  const orderBy: Prisma.ProductOrderByWithRelationInput =
    s.orden === "precio" ? { priceUsd: "asc" } : s.orden === "precio-desc" ? { priceUsd: "desc" } : s.orden === "popular" ? { views: "desc" } : { createdAt: "desc" };

  const [products, categories, brands, total] = await Promise.all([
    prisma.product.findMany({ where, orderBy, take: 48, include: { brand: true, category: { select: { slug: true } } } }),
    getCategoriesCached(),
    getBrandsCached(),
    prisma.product.count({ where: { active: true } }),
  ]);
  const link = (o: Record<string, string | undefined>) => {
    const merged = { ...s, ...o };
    const qs = new URLSearchParams(Object.entries(merged).filter(([, v]) => v) as [string, string][]).toString();
    return `/catalogo${qs ? `?${qs}` : ""}`;
  };
  const hayGiro = skusConGiro().length > 0;
  const activeCount = ["categoria", "marca", "disponible", "oferta", "vista3d", "min", "max", "make", "model", "year", "q"].filter((k) => s[k]).length;
  const vehLabel = [s.make, s.model, s.year].filter(Boolean).join(" ");

  const Filter = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="border-t border-slate-100 py-4 first:border-t-0 first:pt-0">
      <h3 className="mb-2 font-display text-xs font-bold uppercase tracking-wider text-navy">{title}</h3>
      {children}
    </div>
  );

  return (
    <div className="container-x py-8">
      {/* Cabecera */}
      <div className="mb-6">
        <nav className="mb-2 flex items-center gap-1.5 text-xs text-slate-400">
          <Link href="/" className="inline-flex min-h-12 items-center hover:text-navy lg:min-h-0">Inicio</Link><Icon name="chevronRight" size={12} /><span className="text-slate-500">Catálogo</span>
        </nav>
        <div className="flex flex-wrap items-end justify-between gap-3">
          <div>
            <h1 className="font-display text-3xl font-extrabold text-navy">Catálogo</h1>
            <p className="mt-1 text-sm text-slate-500">{total} productos disponibles{vehLabel && ` · filtrado por ${vehLabel}`}</p>
          </div>
          <form action="/catalogo" className="flex items-center gap-2">
            <input type="hidden" name="categoria" value={s.categoria ?? ""} />
            <select name="orden" aria-label="Ordenar productos" defaultValue={s.orden ?? "novedad"} className="input-select min-h-12 w-52 lg:min-h-0">
              {ORDENES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}
            </select>
            <button className="btn btn-ghost min-h-12 lg:min-h-0">Aplicar</button>
          </form>
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        {/* Filtros */}
        <aside className="lg:sticky lg:top-24 lg:self-start">
          <details open className="card p-4">
            <summary className="mb-3 flex cursor-pointer items-center gap-2 font-display text-sm font-bold text-navy">
              <Icon name="filter" size={16} /> Filtros {activeCount > 0 && <span className="badge bg-[color:var(--color-accent)] text-white">{activeCount}</span>}
            </summary>
            <Filter title="Categoría">
              <div className="space-y-1 text-sm">
                {categories.map((c) => (
                  <Link key={c.id} href={link({ categoria: s.categoria === c.slug ? undefined : c.slug })}
                    className={`flex min-h-12 items-center justify-between rounded-lg px-2 py-1.5 transition lg:min-h-0 ${s.categoria === c.slug ? "bg-[color:var(--color-navy)] font-semibold text-white" : "hover:bg-slate-50"}`}>
                    <span>{c.name}</span><span className={`font-mono text-[10px] ${s.categoria === c.slug ? "text-white/70" : "text-slate-500"}`}>{c._count.products}</span>
                  </Link>
                ))}
              </div>
            </Filter>
            <Filter title="Marca">
              <div className="flex flex-wrap gap-1.5">
                {brands.map((b) => (
                  <Link key={b.id} href={link({ marca: s.marca === b.slug ? undefined : b.slug })} className={`chip min-h-12 lg:min-h-0 ${s.marca === b.slug ? "chip-active" : ""}`}>{b.name}</Link>
                ))}
                {brands.length === 0 && <p className="text-xs text-slate-400">Aún no hay marcas.</p>}
              </div>
            </Filter>
            <Filter title="Precio (USD)">
              <form action="/catalogo" className="flex items-center gap-2">
                <input type="hidden" name="categoria" value={s.categoria ?? ""} /><input type="hidden" name="marca" value={s.marca ?? ""} />
                <input name="min" type="number" min="0" placeholder="Mín" defaultValue={s.min ?? ""} className="input px-2 py-1.5 text-sm" />
                <span className="text-slate-400">—</span>
                <input name="max" type="number" min="0" placeholder="Máx" defaultValue={s.max ?? ""} className="input px-2 py-1.5 text-sm" />
                <button className="btn btn-primary min-h-12 px-3 text-xs lg:min-h-0 lg:py-1.5">Ir</button>
              </form>
            </Filter>
            <Filter title="Otros">
              <div className="space-y-1 text-sm">
                {(OPCIONES_OTROS.filter(([k]) => k !== "vista3d" || hayGiro)).map(([key, label]) => (
                  <Link key={key} href={link({ [key]: s[key] === "1" ? undefined : "1" })}
                    className={`flex min-h-12 items-center gap-2 rounded-lg px-2 py-1.5 transition lg:min-h-0 ${s[key] === "1" ? "bg-[color:var(--color-navy)]/6 font-semibold text-navy" : "hover:bg-slate-50"}`}>
                    <span className={`grid h-4 w-4 place-items-center rounded border ${s[key] === "1" ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-white" : "border-slate-300"}`}>
                      {s[key] === "1" && <Icon name="check" size={11} strokeWidth={3} />}
                    </span>
                    {label}
                  </Link>
                ))}
              </div>
            </Filter>
            {activeCount > 0 && <Link href="/catalogo" className="btn btn-ghost mt-3 w-full"><Icon name="refresh" size={16} /> Quitar filtros</Link>}
          </details>
        </aside>

        {/* Resultados */}
        <section>
          {garage.length > 0 && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              <span className="flex items-center gap-1.5 text-slate-500"><Icon name="car" size={16} /> Mi garaje:</span>
              {garage.map((g) => <Link key={g.id} href={link({ make: g.make, model: g.model, year: String(g.year) })} className="chip">{g.make} {g.model} {g.year}</Link>)}
            </div>
          )}
          {(s.make || s.model || year || s.q) && (
            <div className="mb-4 flex flex-wrap items-center gap-2 text-sm">
              {s.q && <span className="chip chip-active">Búsqueda: {s.q} <Link href={link({ q: undefined })} className="ml-1">×</Link></span>}
              {vehLabel && <span className="chip chip-active">Vehículo: {vehLabel} <Link href={link({ make: undefined, model: undefined, year: undefined })} className="ml-1">×</Link></span>}
            </div>
          )}
          {products.length ? (
            <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">{products.map((p) => <ProductCard key={p.id} p={p} />)}</div>
          ) : (
            <div className="card grid place-items-center p-12 text-center">
              <span className="grid h-14 w-14 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="search" size={26} /></span>
              <h3 className="mt-4 font-display text-lg font-bold text-navy">Sin resultados</h3>
              <p className="mt-1 max-w-sm text-sm text-slate-500">No encontramos piezas con esos filtros. Prueba a quitar alguno o consulta por WhatsApp con los datos de tu vehículo.</p>
              <Link href="/catalogo" className="btn btn-primary mt-4">Ver todo el catálogo</Link>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
