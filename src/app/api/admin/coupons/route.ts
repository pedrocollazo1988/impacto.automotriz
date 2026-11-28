import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, errorPanel } from "@/lib/auth";

const Body = z.object({
  id: z.number().int().optional(), code: z.string().min(3).max(30).transform((s) => s.toUpperCase().replace(/\s/g, "")),
  percentOff: z.number().int().min(1).max(100).nullish(), amountOffUsd: z.number().min(0.01).nullish(), minSubtotalUsd: z.number().min(0).nullish(),
  maxUses: z.number().int().min(1).nullish(), startsAt: z.string().nullish(), expiresAt: z.string().nullish(), active: z.boolean().default(true),
});

export const GET = handle(async (req: Request) => { const u = await requireAdmin(req, "coupons"); return Response.json(await prisma.coupon.findMany({ orderBy: { id: "desc" } })); });
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "coupons");
  const parsed = Body.parse(await req.json());
  if (!!parsed.percentOff === !!parsed.amountOffUsd) throw await errorPanel(400, "Indica un porcentaje O un monto fijo", "Enter a percentage OR a fixed amount");
  const { id, startsAt, expiresAt, ...d } = parsed;
  const data = { ...d, startsAt: startsAt ? new Date(startsAt) : null, expiresAt: expiresAt ? new Date(`${expiresAt}T23:59:59`) : null };
  const row = id ? await prisma.coupon.update({ where: { id }, data }) : await prisma.coupon.create({ data });
  await audit(u, "cupon.guardar", row.code);
  return Response.json(row);
});
export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "coupons");
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) throw await errorPanel(400, "Falta id", "Missing id");
  await prisma.coupon.update({ where: { id }, data: { active: false } });
  await audit(u, "cupon.desactivar", String(id));
  return Response.json({ ok: true });
});
