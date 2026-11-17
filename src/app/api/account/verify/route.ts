import { prisma } from "@/lib/prisma";
import { sha256 } from "@/lib/verify";

// Confirma el correo y activa las suscripciones de marketing pendientes (doble confirmación).
export async function GET(req: Request) {
  const token = new URL(req.url).searchParams.get("token") ?? "";
  const t = token.length === 64 ? await prisma.authToken.findUnique({ where: { tokenHash: sha256(token) }, include: { customer: true } }) : null;
  const ok = !!t && t.kind === "VERIFY" && !t.usedAt && t.expiresAt > new Date();
  if (ok && t) {
    await prisma.$transaction([
      prisma.customer.update({ where: { id: t.customerId }, data: { emailVerified: true } }),
      prisma.authToken.update({ where: { id: t.id }, data: { usedAt: new Date() } }),
      prisma.subscriber.updateMany({ where: { email: t.customer.email, status: "PENDING" }, data: { status: "ACTIVE", consentAt: new Date() } }),
    ]);
  }
  return Response.redirect(new URL(`/cuenta?verificado=${ok ? 1 : 0}`, process.env.PUBLIC_URL ?? req.url), 302);
}
