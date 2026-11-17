import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-auth";

// Solo clientes que compraron el producto (pedido pagado, en preparación, enviado o entregado).
export const POST = handle(async (req: Request) => {
  const c = await requireCustomer();
  const b = z.object({ productId: z.number().int(), rating: z.number().int().min(1).max(5), comment: z.string().min(3).max(1000) }).parse(await req.json());
  const bought = await prisma.orderItem.count({ where: { productId: b.productId, order: { customerId: c.id, status: { in: ["PAID", "PREPARING", "SHIPPED", "DELIVERED"] } } } });
  if (!bought) throw new HttpError(403, "Solo puedes valorar productos que compraste");
  await prisma.review.upsert({ where: { productId_customerId: { productId: b.productId, customerId: c.id } }, create: { ...b, customerId: c.id }, update: { rating: b.rating, comment: b.comment } });
  return Response.json({ ok: true });
});
