import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, errorPanel } from "@/lib/auth";

// CRUD administrable de: methods (métodos de entrega), pickup-points, slots (franjas), addons (servicios extra)
const usd = z.number().min(0);
const CFG = {
  methods: { delegate: "deliveryMethod", schema: z.object({
    code: z.string().min(2).max(30), name: z.string().min(2), kind: z.enum(["HOME_DELIVERY", "STORE_PICKUP", "COURIER", "AGREED_POINT"]),
    description: z.string().nullish(), active: z.boolean().default(true), sortOrder: z.number().int().default(0),
    baseFee: usd.default(0), freeFromUsd: usd.nullish(), etaMinDays: z.number().int().min(0).default(1),
    etaMaxDays: z.number().int().min(0).default(3), requiresAddress: z.boolean().default(true), cashOnDelivery: z.boolean().default(false) }) },
  "pickup-points": { delegate: "pickupPoint", schema: z.object({
    name: z.string().min(2), address: z.string().min(3), provinceId: z.number().int(), municipalityId: z.number().int().nullish(),
    phone: z.string().nullish(), hours: z.string().nullish(), readyHours: z.number().int().min(0).default(24),
    active: z.boolean().default(true), sortOrder: z.number().int().default(0) }) },
  slots: { delegate: "deliverySlot", schema: z.object({
    methodId: z.number().int(), label: z.string().min(2), startMin: z.number().int().min(0).max(1439),
    maxOrders: z.number().int().min(1).default(10), active: z.boolean().default(true) }) },
  addons: { delegate: "serviceAddon", schema: z.object({
    code: z.string().min(2).max(30), name: z.string().min(2), description: z.string().nullish(),
    priceUsd: usd.default(0), active: z.boolean().default(true) }) },
} as const;

type Ctx = { params: Promise<{ entity: string }> };
async function cfg(ctx: Ctx) {
  const { entity } = await ctx.params;
  const c = CFG[entity as keyof typeof CFG];
  if (!c) throw await errorPanel(404, "Entidad desconocida", "Unknown entity");
  // El delegate sale de una lista cerrada (CFG) y el cuerpo se valida con zod.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  return { schema: c.schema, db: (prisma as any)[c.delegate] };
}

export const GET = handle(async (req: Request, ctx: Ctx) => {
  const u = await requireAdmin(req, "logistics"); const { db } = await cfg(ctx);
  return Response.json(await db.findMany({ orderBy: { id: "asc" } }));
});
export const POST = handle(async (req: Request, ctx: Ctx) => {
  const u = await requireAdmin(req, "logistics"); const { db, schema } = await cfg(ctx);
  const raw = await req.json(); const data = schema.parse(raw);
  const id = z.number().int().optional().parse(raw.id);
  const row = id ? await db.update({ where: { id }, data }) : await db.create({ data });
  await audit(u, "logistica.guardar", `${(await ctx.params).entity} ${row.id}`);
  return Response.json(row);
});
export const DELETE = handle(async (req: Request, ctx: Ctx) => {
  const u = await requireAdmin(req, "logistics"); const { db } = await cfg(ctx);
  await db.delete({ where: { id: Number(new URL(req.url).searchParams.get("id")) } });
  await audit(u, "logistica.eliminar", (await ctx.params).entity);
  return Response.json({ ok: true });
});
