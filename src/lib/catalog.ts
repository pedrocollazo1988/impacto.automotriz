import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { esVista } from "./viewer";
import { MAX_FOTOGRAMAS_360, MAX_FOTOS, MAX_VIDEOS, recortarMedios } from "./medios";

export const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

type CategoriaResumen = { slug: string; name: string; _count: { products: number } };

// El panel envía el nombre visible, no el slug. Buscar solo por slug creaba una
// categoría nueva cuando el nombre no lo reproducía («Sistema eléctrico» →
// sistema-electrico frente a la histórica electrico) y repartía los productos
// entre duplicados. Se busca por slug o por nombre normalizado y, si hay varios,
// se prefiere la que ya concentra más productos.
export function elegirCategoria<T extends CategoriaResumen>(cats: T[], nombre: string): T | undefined {
  const clave = slugify(nombre);
  return cats
    .filter((c) => c.slug === clave || slugify(c.name) === clave)
    .sort((a, b) => b._count.products - a._count.products)[0];
}

// Fusiona duplicados históricos por nombre: el filtro enseña una sola entrada y
// se queda con la que tiene más productos, que es la que realmente se usa.
export function agruparCategorias<T extends CategoriaResumen & { position: number }>(cats: T[]): T[] {
  const porNombre = new Map<string, T>();
  for (const c of cats) {
    const clave = slugify(c.name);
    const previa = porNombre.get(clave);
    if (!previa || c._count.products > previa._count.products) porNombre.set(clave, c);
  }
  return [...porNombre.values()].sort((a, b) => a.position - b.position || a.name.localeCompare(b.name));
}

// Búsqueda insensible a acentos (español: "bateria" debe encontrar "Batería").
// Usa translate() de Postgres para plegar los acentos; no requiere la extensión unaccent.
const ACCENTS = "áàäâãåéèëêíìïîóòöôõúùüûñçýÿ";
const FOLDED = "aaaaaaeeeeiiiiooooouuuuncyy";

export async function searchProductIds(term: string): Promise<number[]> {
  const q = `%${term.replace(/[\\%_]/g, (c) => `\\${c}`)}%`;
  const rows = await prisma.$queryRawUnsafe<{ id: number }[]>(
    `SELECT id FROM "Product"
     WHERE active = true AND (
       translate(lower(name), $1, $2) LIKE translate(lower($3), $1, $2)
       OR translate(lower(sku), $1, $2) LIKE translate(lower($3), $1, $2)
       OR translate(lower(coalesce(description, '')), $1, $2) LIKE translate(lower($3), $1, $2)
     )`,
    ACCENTS, FOLDED, q,
  );
  return rows.map((r) => r.id);
}

// Categorías y marcas apenas cambian y se piden en cada visita de la portada y
// del catálogo. Cachearlas ahorra dos viajes a la base de datos por carga.
const CATEGORIAS_TAG = "categorias";
const MARCAS_TAG = "marcas";

// Una categoría con productos activos siempre se lista aunque el flag `visible`
// se haya quedado apagado: si no, la tienda enseña productos que el comprador no
// puede acotar desde el filtro. Las ocultas solo desaparecen si están vacías.
export const getCategoriesCached = unstable_cache(
  async () => {
    const filas = await prisma.category.findMany({
      where: { OR: [{ visible: true }, { products: { some: { active: true } } }] },
      orderBy: [{ position: "asc" }, { name: "asc" }],
      // El contador de la portada y del filtro debe reflejar solo lo que se puede
      // comprar; los productos archivados no cuentan.
      include: { _count: { select: { products: { where: { active: true } } } } },
    });
    return agruparCategorias(filas);
  },
  ["categorias-con-conteo"],
  { revalidate: 3600, tags: [CATEGORIAS_TAG] },
);

export const getBrandsCached = unstable_cache(
  async (take?: number) => prisma.brand.findMany({ orderBy: { name: "asc" }, ...(take ? { take } : {}) }),
  ["marcas"],
  { revalidate: 3600, tags: [MARCAS_TAG] },
);

// Se llama tras cualquier alta o cambio de producto para que la portada y el
// catálogo reflejen al instante las categorías y marcas nuevas.
export const invalidarCacheCatalogo = () => {
  revalidateTag(CATEGORIAS_TAG);
  revalidateTag(MARCAS_TAG);
  revalidateTag("producto");
};

export type ProductInput = {
  sku: string; name: string; slug?: string; description?: string; priceUsd: number; compareAtUsd?: number | null; stock: number; lowStockAt?: number;
  images?: string[]; videos?: string[]; model3dUrl?: string | null; model3dVideo?: string | null;
  spin360Frames?: string[]; spin360Video?: string | null;
  viewerMode?: string; specs?: Record<string, string> | null; featured?: boolean; active?: boolean;
  variants?: { sku: string; name: string; priceUsd?: number | null; stock: number; active?: boolean }[];
  categoryName: string; brandName?: string | null; fits?: { make: string; model: string; yearFrom: number; yearTo: number }[];
};

// Alta o actualización (por id o, si no hay, por SKU). Crea categoría y marca si no existen.
export type ProductMovementContext = { actor?: string; source?: string };

export async function saveProduct(i: ProductInput, id?: number, ctx: ProductMovementContext = {}) {
  const nombreCategoria = i.categoryName.trim();
  const categorias = await prisma.category.findMany({
    select: { id: true, slug: true, name: true, _count: { select: { products: true } } },
  });
  const elegida = elegirCategoria(categorias, nombreCategoria);
  const category = elegida ?? await prisma.category.upsert({
    where: { slug: slugify(nombreCategoria) },
    update: {},
    create: { slug: slugify(nombreCategoria), name: nombreCategoria },
  });
  const brand = i.brandName?.trim() ? await prisma.brand.upsert({ where: { slug: slugify(i.brandName) }, update: {}, create: { slug: slugify(i.brandName), name: i.brandName.trim() } }) : null;
  const data = {
    sku: i.sku.trim(), name: i.name.trim(), description: i.description ?? "", priceUsd: i.priceUsd, compareAtUsd: i.compareAtUsd ?? null, stock: i.stock,
    lowStockAt: i.lowStockAt ?? 3, images: recortarMedios(i.images ?? [], MAX_FOTOS),
    videos: recortarMedios(i.videos ?? [], MAX_VIDEOS),
    // Omitir la clave (no enviarla como null) evita que una reimportación del
    // catálogo borre el modelo 3D o la vista que el admin ya había elegido.
    ...(i.model3dUrl !== undefined ? { model3dUrl: i.model3dUrl } : {}),
    ...(i.model3dVideo !== undefined ? { model3dVideo: i.model3dVideo } : {}),
    ...(i.spin360Frames !== undefined ? { spin360Frames: recortarMedios(i.spin360Frames, MAX_FOTOGRAMAS_360) } : {}),
    ...(i.spin360Video !== undefined ? { spin360Video: i.spin360Video } : {}),
    ...(esVista(i.viewerMode) ? { viewerMode: i.viewerMode } : {}),
    specs: i.specs ?? undefined, featured: i.featured ?? false,
    active: i.active ?? true, categoryId: category.id, brandId: brand?.id ?? null,
  };
  const seleccion = { id: true, stock: true, sku: true, name: true, slug: true, priceUsd: true, active: true, categoryId: true, brandId: true } as const;
  const existing = id
    ? await prisma.product.findUnique({ where: { id }, select: seleccion })
    : await prisma.product.findUnique({ where: { sku: data.sku }, select: seleccion });
  let row;
  if (existing) row = await prisma.product.update({ where: { id: existing.id }, data: { ...data, ...(i.slug ? { slug: slugify(i.slug) } : {}) } });
  else {
    const base = slugify(i.slug || i.name); const taken = await prisma.product.findUnique({ where: { slug: base } });
    row = await prisma.product.create({ data: { ...data, slug: taken ? `${base}-${slugify(data.sku)}` : base } });
  }
  if (i.fits) {
    await prisma.productFit.deleteMany({ where: { productId: row.id } });
    if (i.fits.length) await prisma.productFit.createMany({ data: i.fits.map((f) => ({ ...f, productId: row.id })) });
  }
  if (i.variants) {
    const keep = i.variants.map((v) => v.sku.trim());
    for (const v of i.variants) {
      const d = { productId: row.id, name: v.name.trim(), priceUsd: v.priceUsd ?? null, stock: v.stock, active: v.active ?? true };
      await prisma.productVariant.upsert({ where: { sku: v.sku.trim() }, update: d, create: { ...d, sku: v.sku.trim() } });
    }
    await prisma.productVariant.updateMany({ where: { productId: row.id, sku: { notIn: keep } }, data: { active: false } });
    if (i.variants.some((v) => v.active ?? true)) { // el stock del producto es la suma de sus variantes activas
      const sum = (await prisma.productVariant.aggregate({ where: { productId: row.id, active: true }, _sum: { stock: true } }))._sum.stock ?? 0;
      await prisma.product.update({ where: { id: row.id }, data: { stock: sum } });
    }
  }

  // Historial: una fila por alta, cambio de existencias o edición relevante.
  const after = await prisma.product.findUnique({ where: { id: row.id }, select: seleccion });
  const beforeStock = existing?.stock ?? 0;
  if (after) {
    const delta = after.stock - beforeStock;
    const cambios: string[] = [];
    if (!existing) cambios.push("Producto creado");
    else {
      if (existing.name !== after.name) cambios.push(`Nombre: ${existing.name} → ${after.name}`);
      if (Number(existing.priceUsd) !== Number(after.priceUsd)) cambios.push(`Precio: ${Number(existing.priceUsd).toFixed(2)} → ${Number(after.priceUsd).toFixed(2)} USD`);
      if (existing.active !== after.active) cambios.push(after.active ? "Producto reactivado" : "Producto desactivado");
      if (existing.categoryId !== after.categoryId) cambios.push("Cambió la categoría");
      if (existing.brandId !== after.brandId) cambios.push("Cambió la marca");
      if (delta !== 0) cambios.push(`Existencias: ${beforeStock} → ${after.stock}`);
    }
    if (!existing || delta !== 0 || cambios.length) {
      await prisma.productMovement.create({
        data: {
          productId: after.id, productName: after.name, sku: after.sku,
          kind: !existing ? "ALTA" : delta !== 0 ? "AJUSTE" : "EDICION",
          delta, stockBefore: beforeStock, stockAfter: after.stock,
          detail: cambios.join(" · "), actor: ctx.actor ?? "", source: ctx.source ?? "admin",
        },
      });
    }
  }

  // Si el producto pasa de agotado a disponible, avisa a quienes lo esperaban.
  if (after && beforeStock <= 0 && after.stock > 0) {
    const { notifyBackInStock } = await import("./mailer");
    const base = (process.env.PUBLIC_URL ?? "https://impacto-automotriz.vercel.app").replace(/\/+$/, "");
    await notifyBackInStock(String(after.id), after.name, `${base}/producto/${after.slug ?? after.id}`).catch(() => {});
  }

  invalidarCacheCatalogo();
  return { row, created: !existing };
}

// CSV (coma o punto y coma, comillas, UTF-8 con o sin BOM) → filas
export function parseCsv(text: string): string[][] {
  const t = text.replace(/^\uFEFF/, ""); const first = t.split(/\r?\n/, 1)[0] ?? "";
  const d = (first.match(/;/g)?.length ?? 0) > (first.match(/,/g)?.length ?? 0) ? ";" : ",";
  const rows: string[][] = []; let row: string[] = [], f = "", q = false;
  const end = () => { row.push(f); f = ""; if (row.some((x) => x.trim())) rows.push(row); row = []; };
  for (let k = 0; k < t.length; k++) {
    const c = t[k];
    if (q) { if (c === '"') { if (t[k + 1] === '"') { f += '"'; k++; } else q = false; } else f += c; }
    else if (c === '"') q = true;
    else if (c === d) { row.push(f); f = ""; }
    else if (c === "\n" || c === "\r") { if (c === "\r" && t[k + 1] === "\n") k++; end(); }
    else f += c;
  }
  if (f || row.length) end();
  return rows;
}
