import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, errorPanel, textoPanel } from "@/lib/auth";

const key = (p: number, m?: number | null) => `${p}:${m ?? "*"}`;

// GET ?methodId=1&provinceId=3 → reglas del método en esa provincia
export const GET = handle(async (req: Request) => {
  const u = await requireAdmin(req, "logistics");
  const sp = new URL(req.url).searchParams;
  return Response.json(await prisma.deliveryRule.findMany({ where: { methodId: Number(sp.get("methodId")), provinceId: Number(sp.get("provinceId")) } }));
});

// POST: crea/actualiza la regla de TODA la provincia (sin municipalityIds) o de municipios concretos.
const Body = z.object({
  methodId: z.number().int(), provinceId: z.number().int(), municipalityIds: z.array(z.number().int()).optional(),
  available: z.boolean(), feeUsd: z.number().min(0).nullish(), freeFromUsd: z.number().min(0).nullish(),
  minOrderUsd: z.number().min(0).nullish(), etaMinDays: z.number().int().min(0).nullish(),
  etaMaxDays: z.number().int().min(0).nullish(), note: z.string().max(200).nullish(),
});
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "logistics");
  const { methodId, provinceId, municipalityIds, ...f } = Body.parse(await req.json());
  const ids: (number | null)[] = municipalityIds?.length ? municipalityIds : [null];
  if (municipalityIds?.length) {
    const ok = await prisma.municipality.count({ where: { id: { in: municipalityIds }, provinceId } });
    if (ok !== municipalityIds.length) throw await errorPanel(400, "Municipios que no pertenecen a la provincia", "Municipalities that do not belong to the province");
  }
  await prisma.$transaction(ids.map((municipalityId) =>
    prisma.deliveryRule.upsert({
      where: { methodId_scopeKey: { methodId, scopeKey: key(provinceId, municipalityId) } },
      create: { methodId, provinceId, municipalityId, scopeKey: key(provinceId, municipalityId), ...f },
      update: f,
    })));
  await audit(u, "zonas.guardar", await textoPanel(`método ${methodId} provincia ${provinceId} (${ids.length})`, `method ${methodId} province ${provinceId} (${ids.length})`));
  return Response.json({ ok: true, updated: ids.length });
});

export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "logistics");
  await prisma.deliveryRule.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } });
  return Response.json({ ok: true });
});
