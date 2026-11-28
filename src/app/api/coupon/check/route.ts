import { z } from "zod";
import { handle } from "@/lib/auth";
import { evaluateCoupon } from "@/lib/coupons";
import { getLang } from "@/lib/i18n";

export const POST = handle(async (req: Request) => {
  const b = z.object({ code: z.string().max(30), subtotalUsd: z.number().min(0) }).parse(await req.json());
  const idioma = await getLang();
  const r = await evaluateCoupon(b.code, b.subtotalUsd, idioma);
  return Response.json({ discountUsd: r.discountUsd, code: r.code });
});
