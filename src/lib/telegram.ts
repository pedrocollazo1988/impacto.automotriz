import crypto from "node:crypto";

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
