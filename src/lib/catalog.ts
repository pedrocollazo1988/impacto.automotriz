import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "./prisma";
import { esVista } from "./viewer";
import { MAX_FOTOGRAMAS_360, MAX_FOTOS, MAX_VIDEOS, recortarMedios } from "./medios";

export const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

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

// Solo las visibles: una categoría oculta desde el panel desaparece de la
// portada, del catálogo y de la barra de departamentos a la vez.
export const getCategoriesCached = unstable_cache(
  async () => prisma.category.findMany({
    where: { visible: true },
    orderBy: [{ position: "asc" }, { name: "asc" }],
    // El contador de la portada y del filtro debe reflejar solo lo que se puede
    // comprar; los productos archivados no cuentan.
    include: { _count: { select: { products: { where: { active: true } } } } },
  }),
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
export async function saveProduct(i: ProductInput, id?: number) {
  const category = await prisma.category.upsert({ where: { slug: slugify(i.categoryName) }, update: {}, create: { slug: slugify(i.categoryName), name: i.categoryName.trim() } });
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
  const existing = id ? { id } : await prisma.product.findUnique({ where: { sku: data.sku }, select: { id: true } });
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
