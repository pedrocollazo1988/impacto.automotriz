import crypto from "node:crypto";
import { cookies } from "next/headers";
import { prisma } from "./prisma";
import { HttpError } from "./auth";

const COOKIE = "ia_cust";

// Sin APP_SECRET no se pueden firmar sesiones. Antes se firmaba con clave vacía
// y la cookie se creaba igual, pero luego nadie podía validarla: el usuario
// "iniciaba sesión" y seguía sin estar autenticado. Ahora se avisa claramente.
export function assertCustomerAuthConfigured() {
  if (!process.env.APP_SECRET) throw new HttpError(500, "El servidor no tiene configurada APP_SECRET: las sesiones no funcionan hasta definirla.");
}

const sig = (v: string) => crypto.createHmac("sha256", process.env.APP_SECRET ?? "").update(`cust:${v}`).digest("hex");

export { hashPassword, verifyPassword } from "./password";
export async function startCustomerSession(id: string) {
  assertCustomerAuthConfigured();
  const v = `${id}.${Date.now() + 30 * 864e5}`;
  (await cookies()).set(COOKIE, `${v}.${sig(v)}`, { httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400 });
}
export const endCustomerSession = async () => { (await cookies()).delete(COOKIE); };

export async function getCustomer() {
  if (!process.env.APP_SECRET) return null;
  const raw = (await cookies()).get(COOKIE)?.value; if (!raw) return null;
  const [id, exp, s] = raw.split("."); if (!id || !exp || !s || Number(exp) < Date.now()) return null;
  const a = Buffer.from(sig(`${id}.${exp}`)), b = Buffer.from(s);
  if (a.length !== b.length || !crypto.timingSafeEqual(a, b)) return null;
  return prisma.customer.findUnique({ where: { id }, select: { id: true, email: true, name: true, phone: true, phoneE164: true, emailVerified: true, phoneVerifiedAt: true, avatarUrl: true, preferredLanguage: true } });
}
export async function requireCustomer() {
  const c = await getCustomer(); if (!c) throw new HttpError(401, "Inicia sesión"); return c;
}
