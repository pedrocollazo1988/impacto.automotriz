import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";

// GET /api/geo                → provincias
// GET /api/geo?provinceId=3   → municipios de esa provincia
export const GET = handle(async (req: Request) => {
  const id = new URL(req.url).searchParams.get("provinceId");
  const select = { id: true, name: true };
  const data = id
    ? await prisma.municipality.findMany({ where: { provinceId: Number(id) }, orderBy: { name: "asc" }, select })
    : await prisma.province.findMany({ orderBy: { id: "asc" }, select });
  return Response.json(data, { headers: { "Cache-Control": "public, max-age=86400" } });
});
