import crypto from "node:crypto";
import { prisma } from "./prisma";

export type TelegramUsuario = { id: string; nombre: string; usuario: string | null; foto: string | null };

// El widget firma con HMAC-SHA256 usando como clave el SHA256 del token del bot.
// Se rechazan firmas de más de 5 minutos para que un enlace copiado no sirva.
const MAX_ANTIGUEDAD = 300;

export function estadoTelegram(env: Record<string, string | undefined> = process.env) {
  const token = env.TELEGRAM_BOT_TOKEN ?? "";
  const usuario = (env.TELEGRAM_BOT_USERNAME ?? "").replace(/^@/, "");
  return { configurado: /^\d+:[\w-]+$/.test(token) && usuario.length > 0, usuario };
}

export function verificarTelegram(
  params: URLSearchParams,
  env: Record<string, string | undefined> = process.env,
  ahora = Date.now(),
): TelegramUsuario | null {
  const token = env.TELEGRAM_BOT_TOKEN;
  if (!token) return null;

  const hash = (params.get("hash") ?? "").toLowerCase();
  if (!/^[0-9a-f]{64}$/.test(hash)) return null;

  const datos = [...params.entries()]
    .filter(([clave]) => clave !== "hash")
    .sort(([a], [b]) => (a < b ? -1 : a > b ? 1 : 0));
  const texto = datos.map(([clave, valor]) => `${clave}=${valor}`).join("\n");
  const clave = crypto.createHash("sha256").update(token).digest();
  const esperado = crypto.createHmac("sha256", clave).update(texto).digest("hex");
  if (!crypto.timingSafeEqual(Buffer.from(esperado), Buffer.from(hash))) return null;

  const fecha = Number(params.get("auth_date"));
  if (!Number.isFinite(fecha) || Math.abs(ahora / 1000 - fecha) > MAX_ANTIGUEDAD) return null;

  const id = params.get("id") ?? "";
  if (!/^\d{1,20}$/.test(id)) return null;

  const nombre = [params.get("first_name"), params.get("last_name")].map((v) => (v ?? "").trim()).filter(Boolean).join(" ");
  return {
    id,
    nombre: (nombre || params.get("username") || "Cliente Telegram").slice(0, 120),
    usuario: params.get("username") || null,
    foto: params.get("photo_url") || null,
  };
}

/** Enlace que abre el bot con un nonce. Es el camino que sí funciona en el móvil. */
export function urlBot(usuario: string, nonce: string): string {
  return `https://t.me/${usuario}?start=${nonce}`;
}

export function generarNonce(): string {
  return crypto.randomBytes(24).toString("base64url");
}

/** Extrae el nonce de `/start <nonce>`; cualquier otro mensaje devuelve null. */
export function comandoStart(texto: string | undefined | null): string | null {
  const m = /^\/start(?:@\w+)?\s+(\S{16,64})$/.exec((texto ?? "").trim());
  return m ? m[1] : null;
}

export async function enviarMensaje(chatId: string, texto: string, token = process.env.TELEGRAM_BOT_TOKEN) {
  if (!token) return false;
  const r = await fetch(`https://api.telegram.org/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ chat_id: chatId, text: texto, disable_web_page_preview: true }),
  });
  return r.ok;
}

/** Caducidad del enlace de entrada: si no se usa en 10 minutos, no vale. */
export const NONCE_MINUTOS = 10;

export async function crearEnlaceTelegram(usuario: string) {
  const nonce = generarNonce();
  await prisma.telegramLogin.create({ data: { nonce } });
  return { nonce, url: urlBot(usuario, nonce) };
}

export async function nonceCaducado(creadoEn: Date, ahora = Date.now()): Promise<boolean> {
  return ahora - creadoEn.getTime() > NONCE_MINUTOS * 60_000;
}
