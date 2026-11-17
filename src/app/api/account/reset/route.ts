import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { hashPassword } from "@/lib/customer-auth";

export const POST = handle(async (req: Request) => {
  await limit(req, "reset", 5);
  const b = z.object({ token: z.string().length(64), password: z.string().min(8).max(100) }).parse(await req.json());
  const r = await prisma.authToken.findUnique({ where: { tokenHash: crypto.createHash("sha256").update(b.token).digest("hex") } });
  if (!r || r.kind !== "RESET" || r.usedAt || r.expiresAt < new Date()) throw new HttpError(400, "Enlace inválido o vencido");
  await prisma.$transaction([
    prisma.customer.update({ where: { id: r.customerId }, data: { passwordHash: hashPassword(b.password) } }),
    prisma.authToken.update({ where: { id: r.id }, data: { usedAt: new Date() } }),
  ]);
  return Response.json({ ok: true });
});
