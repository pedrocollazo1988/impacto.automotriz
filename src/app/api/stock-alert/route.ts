import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { requireTurnstile } from "@/lib/turnstile";

export const POST = handle(async (req: Request) => {
  const b = z.object({ productId: z.number().int(), email: z.string().email().max(160).transform((s) => s.toLowerCase()), turnstileToken: z.string().max(2048).optional() }).parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);
  await prisma.product.findUniqueOrThrow({ where: { id: b.productId } });
  await prisma.stockAlert.upsert({ where: { productId_email: { productId: String(b.productId), email: b.email } }, create: { productId: String(b.productId), email: b.email }, update: {} });
  return Response.json({ ok: true });
});
