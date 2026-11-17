import { prisma } from "@/lib/prisma";
import { validUnsubToken } from "@/lib/mailer";

async function unsub(email: string | null, token: string | null) {
  if (!email || !token || !validUnsubToken(email, token)) return false;
  await prisma.subscriber.updateMany({ where: { email: email.toLowerCase() }, data: { status: "UNSUBSCRIBED" } });
  return true;
}
// Enlace del correo
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const ok = await unsub(sp.get("e"), sp.get("t"));
  return new Response(`<meta charset="utf-8"><body style="font-family:Arial;text-align:center;padding:60px"><h2>${ok ? "Te diste de baja correctamente" : "Enlace no válido"}</h2></body>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
// Baja con un clic (Gmail/Outlook, cabecera List-Unsubscribe-Post)
export async function POST(req: Request) {
  const sp = new URL(req.url).searchParams;
  return Response.json({ ok: await unsub(sp.get("e"), sp.get("t")) });
}
