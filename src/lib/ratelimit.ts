import { errorHttp } from "@/lib/mensajes";
import { prisma } from "./prisma";
import { HttpError } from "./auth";

// Límite de intentos persistente en PostgreSQL (válido con varias instancias; sin Redis).
export async function limit(req: Request, scope: string, max = 8, windowMs = 60_000) {
  const key = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "local";
  return limitKey(key, scope, max, windowMs);
}

// Mismo límite, pero con una clave elegida por el llamador (por ejemplo, el id
// del cliente) para que cambiar de IP no reinicie el contador.
export async function limitKey(rawKey: string, scope: string, max = 8, windowMs = 60_000) {
  const key = `${scope}:${rawKey}`;
  const now = new Date();
  const row = await prisma.rateLimit.upsert({ where: { key }, create: { key, count: 1, resetAt: new Date(now.getTime() + windowMs) }, update: { count: { increment: 1 } } });
  if (row.resetAt < now) { await prisma.rateLimit.update({ where: { key }, data: { count: 1, resetAt: new Date(now.getTime() + windowMs) } }); return; }
  if (row.count > max) throw await errorHttp(429, "err.demasiadosIntentos");
}
