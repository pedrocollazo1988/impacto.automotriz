import crypto from "node:crypto";
import { prisma } from "@/lib/prisma";

// Catálogo de solo lectura para el agente de IA multicanal.
// Autenticación: cabecera  Authorization: Bearer <AGENT_API_KEY>
// GET /api/agent/products?q=pastillas&categoria=frenos&make=Toyota&model=Corolla&year=2015&limit=20
export async function GET(req: Request) {
  const key = process.env.AGENT_API_KEY ?? "";
  const got = (req.headers.get("authorization") ?? "").replace(/^Bearer\s+/i, "");
  const a = Buffer.from(key), b = Buffer.from(got);
  if (!key || a.length !== b.length || !crypto.timingSafeEqual(a, b)) return new Response("Unauthorized", { status: 401 });

  const s = new URL(req.url).searchParams; const year = Number(s.get("year")) || undefined;
  const make = s.get("make"), model = s.get("model"), q = s.get("q"), cat = s.get("categoria");
  const items = await prisma.product.findMany({
    where: {
      active: true,
      ...(q ? { OR: [{ name: { contains: q, mode: "insensitive" } }, { sku: { contains: q, mode: "insensitive" } }, { description: { contains: q, mode: "insensitive" } }] } : {}),
      ...(cat ? { category: { slug: cat } } : {}),
      ...(make || model || year ? { fits: { some: { ...(make ? { make: { contains: make, mode: "insensitive" } } : {}), ...(model ? { model: { contains: model, mode: "insensitive" } } : {}), ...(year ? { yearFrom: { lte: year }, yearTo: { gte: year } } : {}) } } } : {}),
    },
    take: Math.min(Number(s.get("limit")) || 20, 50), orderBy: { id: "desc" }, include: { category: true, brand: true, fits: true },
  });
  return Response.json(items.map((p) => ({
    sku: p.sku, name: p.name, description: p.description, priceUsd: Number(p.priceUsd), currency: "USD", inStock: p.stock > 0, stock: p.stock,
    category: p.category.name, brand: p.brand?.name ?? null, specs: p.specs, compatibleWith: p.fits.map((f) => `${f.make} ${f.model} ${f.yearFrom}-${f.yearTo}`),
    url: `${process.env.PUBLIC_URL}/producto/${p.slug}`, image: p.images[0] ?? null,
  })));
}
