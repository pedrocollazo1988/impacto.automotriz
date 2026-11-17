import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-auth";

export const GET = handle(async () => { const c = await requireCustomer(); return Response.json((await prisma.wishlistItem.findMany({ where: { customerId: c.id } })).map((w) => w.productId)); });
export const POST = handle(async (req: Request) => {
  const c = await requireCustomer(); const { productId } = z.object({ productId: z.number().int() }).parse(await req.json());
  await prisma.wishlistItem.upsert({ where: { customerId_productId: { customerId: c.id, productId } }, create: { customerId: c.id, productId }, update: {} });
  return Response.json({ ok: true });
});
export const DELETE = handle(async (req: Request) => {
  const c = await requireCustomer();
  await prisma.wishlistItem.deleteMany({ where: { customerId: c.id, productId: Number(new URL(req.url).searchParams.get("productId")) } });
  return Response.json({ ok: true });
});
