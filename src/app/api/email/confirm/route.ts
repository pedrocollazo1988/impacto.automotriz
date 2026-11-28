import { prisma } from "@/lib/prisma";
import { validConfirmToken } from "@/lib/mailer";
import { idiomaDe } from "@/lib/i18n-dict";
import { textoMensaje, type IdiomaMensaje } from "@/lib/mensajes";

export async function GET(req: Request) {
  const sp = new URL(req.url).searchParams; const e = sp.get("e"), t = sp.get("t");
  const ok = !!e && !!t && validConfirmToken(e, t);
  const email = e?.toLowerCase() ?? "";
  const fila = ok && email ? await prisma.subscriber.findUnique({ where: { email }, select: { lang: true } }) : null;
  if (ok) await prisma.subscriber.updateMany({ where: { email }, data: { status: "ACTIVE", consentAt: new Date() } });
  // El enlace se abre desde el correo, sin cookie: se usa el idioma del suscriptor.
  const idioma: IdiomaMensaje = idiomaDe(fila?.lang) ?? "es";
  const texto = textoMensaje(ok ? "msg.email.confirmada" : "msg.email.enlaceInvalido", idioma);
  return new Response(`<meta charset="utf-8"><body style="font-family:Arial;text-align:center;padding:60px"><h2>${texto}</h2></body>`, { status: ok ? 200 : 400, headers: { "Content-Type": "text/html; charset=utf-8" } });
}
