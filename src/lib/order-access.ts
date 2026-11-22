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

const readCookie = async () => {
  const raw = (await cookies()).get(COOKIE)?.value;
  if (!raw) return { ids: [] as string[], sig: "" };
  const [ids = "", sig = ""] = raw.split("|");
  return { ids: ids.split(",").filter(Boolean), sig };
};

export async function rememberOrder(id: string) {
  if (!process.env.APP_SECRET) return;
  const { ids } = await readCookie();
  const next = [id, ...ids.filter((x) => x !== id)].slice(0, MAX);
  const value = next.join(",");
  (await cookies()).set(COOKIE, `${value}|${hmac(value)}`, {
    httpOnly: true, secure: process.env.NODE_ENV === "production", sameSite: "lax", path: "/", maxAge: 30 * 86400,
  });
}

export async function canViewOrder(order: { id: string; customerId: string | null; customerEmail: string }, token?: string) {
  if (tokenMatches(order.id, token)) return true;
  const { ids, sig } = await readCookie();
  if (ids.includes(order.id) && sig && safeEq(sig, hmac(ids.join(",")))) return true;
  const me = await getCustomer();
  if (!me) return false;
  if (order.customerId) return order.customerId === me.id;
  // Pedido de invitado: solo lo ve la cuenta con ese correo y, además, con el
  // correo ya verificado. Sin esa condición bastaba registrarse con la dirección
  // de otra persona para leer sus pedidos.
  return me.emailVerified && order.customerEmail.toLowerCase() === me.email.toLowerCase();
}
