import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-auth";
import { requireTurnstile } from "@/lib/turnstile";

export const GET = handle(async () => { const c = await requireCustomer(); return Response.json(await prisma.garageVehicle.findMany({ where: { customerId: c.id } })); });
export const POST = handle(async (req: Request) => {
  const c = await requireCustomer();
  const b = z.object({ make: z.string().min(2).max(40), model: z.string().min(1).max(40), year: z.number().int().min(1950).max(2100), alias: z.string().max(40).optional(), turnstileToken: z.string().max(2048).optional() }).parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);
  if ((await prisma.garageVehicle.count({ where: { customerId: c.id } })) >= 10) return Response.json({ error: "Máximo 10 vehículos" }, { status: 409 });
  return Response.json(await prisma.garageVehicle.create({ data: { make: b.make, model: b.model, year: b.year, alias: b.alias, customerId: c.id } }));
});
export const DELETE = handle(async (req: Request) => {
  const c = await requireCustomer();
  await prisma.garageVehicle.deleteMany({ where: { id: Number(new URL(req.url).searchParams.get("id")), customerId: c.id } });
  return Response.json({ ok: true });
});
