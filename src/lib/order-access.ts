import crypto from "node:crypto";
import { cookies } from "next/headers";
import { getCustomer } from "./customer-auth";

// El id del pedido viaja en la URL y en el correo, así que por sí solo no puede
// ser la única llave: enumerarlo expondría nombre, teléfono y dirección.
// Tres formas legítimas de ver un pedido:
//   1. Sesión de la cuenta que lo hizo.
//   2. Enlace con token firmado (el del correo de confirmación).
//   3. Cookie firmada que se deja al terminar la compra (invitados incluidos).
const COOKIE = "ia_ord";
const MAX = 10;

const hmac = (v: string) => crypto.createHmac("sha256", process.env.APP_SECRET ?? "").update(`order:${v}`).digest("hex");
const safeEq = (a: string, b: string) => {
  const x = Buffer.from(a), y = Buffer.from(b);
  return x.length === y.length && crypto.timingSafeEqual(x, y);
};

export const orderToken = (id: string) => hmac(id).slice(0, 32);

export function tokenMatches(id: string, token: string | undefined) {
  if (!process.env.APP_SECRET || !token) return false;
  return safeEq(orderToken(id), token);
}

const readCookie = async () => ({
  ids: unpackOrderIds((await cookies()).get(COOKIE)?.value),
});

// Empaquetado y verificación separados del acceso a cookies para poder probarlos
// sin una petición: la firma es lo que impide añadir un id a mano.
export const packOrderIds = (ids: string[]) => {
  const value = ids.join(",");
  return `${value}|${hmac(value)}`;
};

export function unpackOrderIds(raw: string | undefined): string[] {
  if (!process.env.APP_SECRET || !raw) return [];
  const i = raw.lastIndexOf("|");
  if (i < 0) return [];
  const value = raw.slice(0, i), sig = raw.slice(i + 1);
  if (!value || !sig || !safeEq(sig, hmac(value))) return [];
  return value.split(",").filter(Boolean);
}

export async function rememberOrder(id: string) {
  if (!process.env.APP_SECRET) return;
  const { ids } = await readCookie();
  const next = [id, ...ids.filter((x) => x !== id)].slice(0, MAX);
  (await cookies()).set(COOKIE, packOrderIds(next), {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400,
  });
}

export async function canViewOrder(order: { id: string; customerId: string | null; customerEmail: string }, token?: string) {
  if (tokenMatches(order.id, token)) return true;
  const { ids } = await readCookie();
  if (ids.includes(order.id)) return true;
  const me = await getCustomer();
  if (!me) return false;
  if (order.customerId) return order.customerId === me.id;
  // Pedido de invitado: solo lo ve la cuenta con ese correo y, además, con el
  // correo ya verificado. Sin esa condición bastaba registrarse con la dirección
  // de otra persona para leer sus pedidos.
  return me.emailVerified && order.customerEmail.toLowerCase() === me.email.toLowerCase();
}
