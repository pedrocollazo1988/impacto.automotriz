import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { requireCustomer } from "@/lib/customer-auth";
import { sendVerification } from "@/lib/verify";

export const POST = handle(async (req: Request) => {
  await limit(req, "verify-resend", 3);
  const me = await requireCustomer();
  const c = await prisma.customer.findUniqueOrThrow({ where: { id: me.id } });
  if (!c.emailVerified) await sendVerification(c);
  return Response.json({ ok: true });
});
