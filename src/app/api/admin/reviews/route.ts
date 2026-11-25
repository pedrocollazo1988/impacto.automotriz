import { revalidateTag } from "next/cache";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin } from "@/lib/auth";

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "reviews");
  const b = z.object({ id: z.number().int(), visible: z.boolean() }).parse(await req.json());
  await prisma.review.update({ where: { id: b.id }, data: { visible: b.visible } });
  revalidateTag("resenas");
  await audit(u, b.visible ? "resena.mostrar" : "resena.ocultar", String(b.id));
  return Response.json({ ok: true });
});
