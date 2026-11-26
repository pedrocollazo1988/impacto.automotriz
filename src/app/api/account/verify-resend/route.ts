import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { requireCustomer } from "@/lib/customer-auth";
import { sendVerificationPin } from "@/lib/verify";
import { getLang } from "@/lib/i18n";

export const POST = handle(async (req: Request) => {
  await limit(req, "verify-resend", 3, 5 * 60_000);
  const me = await requireCustomer();
  await limitKey(me.id, "verify-resend", 3, 10 * 60_000);
  const c = await prisma.customer.findUniqueOrThrow({ where: { id: me.id } });
  if (!c.emailVerified) {
    const r = await sendVerificationPin(c, await getLang());
    if (!r.ok) throw new HttpError(502, "No pudimos enviar el código. Revisa la configuración de correo e inténtalo de nuevo.");
  }
  return Response.json({ ok: true });
});
