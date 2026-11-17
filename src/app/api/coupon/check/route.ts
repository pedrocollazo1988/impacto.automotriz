import { z } from "zod";
import { handle } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupons";

export const POST = handle(async (req: Request) => {
  const b = z.object({ code: z.string().max(30), subtotalUsd: z.number().min(0) }).parse(await req.json());
  const r = await evaluateCoupon(b.code, b.subtotalUsd);
  return Response.json({ discountUsd: r.discountUsd, code: r.code });
});
