import { HttpError } from "./auth";
import { textoMensaje, type IdiomaMensaje } from "./mensajes";

export const turnstileActivo = () => !!process.env.TURNSTILE_SECRET_KEY;

/**
 * Valida el token de Cloudflare Turnstile en el servidor.
 *
 * Sin TURNSTILE_SECRET_KEY se omite para no bloquear el desarrollo local, pero
 * producción debe definirla junto con NEXT_PUBLIC_TURNSTILE_SITE_KEY.
 */
export async function requireTurnstile(req: Request, token?: string | null, idioma: IdiomaMensaje = "es") {
  const secret = process.env.TURNSTILE_SECRET_KEY;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  if (!secret) {
    // Evita una falsa sensación de seguridad: si la web pide CAPTCHA pero el
    // servidor no puede validarlo, es un error de configuración, no un bypass.
    if (siteKey) throw new HttpError(500, "Falta TURNSTILE_SECRET_KEY en el servidor.");
    return;
  }
  if (!siteKey) throw new HttpError(500, "Falta NEXT_PUBLIC_TURNSTILE_SITE_KEY en el servidor.");
  if (!token || token.length > 2048) throw new HttpError(400, textoMensaje("msg.captcha.requerido", idioma));

  const body = new URLSearchParams({ secret, response: token });
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim();
  if (ip) body.set("remoteip", ip);

  const r = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
    method: "POST",
    body,
    cache: "no-store",
  }).catch(() => null);
  const j = r ? await r.json().catch(() => null) : null;
  if (!r?.ok || !j?.success) throw new HttpError(400, textoMensaje("msg.captcha.fallo", idioma));
}
