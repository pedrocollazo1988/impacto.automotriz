import { z } from "zod";
import { handle } from "@/lib/auth";
import { priceCart } from "@/lib/pricing";

export const Items = z.array(z.object({ productId: z.number().int(), variantId: z.number().int().nullish(), qty: z.number().int().min(1).max(99) })).min(1).max(50);
export const POST = handle(async (req: Request) => {
  const { items } = z.object({ items: Items }).parse(await req.json());
  return Response.json(await priceCart(items));
});
