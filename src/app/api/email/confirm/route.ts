import { prisma } from "@/lib/prisma";
import { validConfirmToken } from "@/lib/mailer";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams; const e = sp.get("e"), t = sp.get("t");
  const ok = !!e && !!t && validConfirmToken(e, t);
  if (ok) await prisma.subscriber.updateMany({ where: { email: e!.toLowerCase(), status: "PENDING" }, data: { status: "ACTIVE", consentAt: new Date() } });
  return new Response(`<meta charset="utf-8"><body style="font-family:Arial;text-align:center;padding:60px"><h2>${ok ? "¡Suscripción confirmada!" : "Enlace no válido"}</h2></body>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
