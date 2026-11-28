import { prisma } from "@/lib/prisma";
import { validUnsubToken } from "@/lib/mailer";
import { idiomaDe } from "@/lib/i18n-dict";
import { textoMensaje, type IdiomaMensaje } from "@/lib/mensajes";

// El enlace llega por correo, sin cookie de idioma: se usa el del suscriptor.
async function unsub(email: string | null, token: string | null): Promise<{ ok: boolean; idioma: IdiomaMensaje }> {
  if (!email || !token || !validUnsubToken(email, token)) return { ok: false, idioma: "es" };
  const correo = email.toLowerCase();
  const fila = await prisma.subscriber.findUnique({ where: { email: correo }, select: { lang: true } });
  await prisma.subscriber.updateMany({ where: { email: correo }, data: { status: "UNSUBSCRIBED" } });
  return { ok: true, idioma: idiomaDe(fila?.lang) ?? "es" };
}
// Enlace del correo
export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams;
  const { ok, idioma } = await unsub(sp.get("e"), sp.get("t"));
  const texto = textoMensaje(ok ? "msg.email.baja" : "msg.email.enlaceInvalido", idioma);
  return new Response(`<meta charset="utf-8"><body style="font-family:Arial;text-align:center;padding:60px"><h2>${texto}</h2></body>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
// Baja con un clic (Gmail/Outlook, cabecera List-Unsubscribe-Post)
export async function POST(req: Request) {
  const sp = new URL(req.url).searchParams;
  return Response.json({ ok: (await unsub(sp.get("e"), sp.get("t"))).ok });
}
