import crypto from "node:crypto";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { ZodError } from "zod";
import { prisma } from "./prisma";
import { hashPassword, verifyPassword } from "./password";

export class HttpError extends Error {
  constructor(public status: number, message: string) { super(message); }
}

// ───────── Equipo: roles y permisos ─────────
export type Perm = "orders" | "products" | "coupons" | "logistics" | "email" | "reports" | "reviews" | "team" | "media" | "payments" | "content";
export type Role = "ADMIN" | "MANAGER" | "SALES" | "WAREHOUSE";
const ALL: Perm[] = ["orders", "products", "coupons", "logistics", "email", "reports", "reviews", "team", "media", "payments", "content"];
export const ROLE_PERMS: Record<Role, Perm[]> = {
  ADMIN: ALL,
  MANAGER: ALL.filter((p) => p !== "team"),
  SALES: ["orders", "coupons", "reports", "reviews", "email", "payments", "content"],
  WAREHOUSE: ["products", "orders", "media", "logistics"],
};
export type StaffSession = { id: string; name: string; email: string; role: Role };
export const can = (u: StaffSession, p: Perm) => ROLE_PERMS[u.role].includes(p);
/** La baja de un producto es irreversible desde la tienda: solo el ADMIN. */
export const puedeEliminarProducto = (u: Pick<StaffSession, "role">) => u.role === "ADMIN";

export const SESSION_COOKIE = "ia_admin";
const sig = (v: string) => crypto.createHmac("sha256", process.env.APP_SECRET ?? "").update(`staff:${v}`).digest("hex");
const safeEq = (a: string, b: string) => { const x = Buffer.from(a), y = Buffer.from(b); return x.length === y.length && crypto.timingSafeEqual(x, y); };
const sha = (s: string) => crypto.createHash("sha256").update(s).digest("hex");
export const sessionToken = (id: string) => {   const v = `${id}.${Date.now() + 8 * 3600_000}`; return `${v}.${sig(v)}`; };

// Igual que en las sesiones de cliente: sin APP_SECRET la cookie se firma con
// clave vacía y luego no se puede validar. Mejor fallar al crear la sesión.
export function assertStaffAuthConfigured() {
  if (!process.env.APP_SECRET) throw new HttpError(500, "El servidor no tiene configurada APP_SECRET: el panel no funciona hasta definirla.");
}

// El primer administrador se crea al iniciar sesión con ADMIN_EMAIL + ADMIN_PASSWORD (solo si no hay equipo aún).
export async function loginStaff(emailIn: string, password: string) {
  assertStaffAuthConfigured();
  const email = emailIn.trim().toLowerCase();
  let staff = await prisma.staffUser.findUnique({ where: { email } });
  if (!staff && (await prisma.staffUser.count()) === 0 && process.env.ADMIN_EMAIL?.toLowerCase() === email && process.env.ADMIN_PASSWORD && safeEq(sha(password), sha(process.env.ADMIN_PASSWORD)))
    staff = await prisma.staffUser.create({ data: { email, name: "Administrador", role: "ADMIN", passwordHash: hashPassword(password) } });
  if (!staff || !staff.active || !verifyPassword(password, staff.passwordHash)) throw new HttpError(401, "Credenciales incorrectas");
  await prisma.staffUser.update({ where: { id: staff.id }, data: { lastLoginAt: new Date() } });
  return staff;
}

export async function getSessionUser(_req?: Request): Promise<StaffSession | null> {
  if (!process.env.APP_SECRET) return null;
  const raw = (await cookies()).get(SESSION_COOKIE)?.value; if (!raw) return null;
  const [id, exp, s] = raw.split("."); if (!id || !exp || !s || Number(exp) < Date.now() || !safeEq(s, sig(`${id}.${exp}`))) return null;
  const u = await prisma.staffUser.findUnique({ where: { id } });
  return u?.active ? { id: u.id, name: u.name, email: u.email, role: u.role } : null;
}
export async function requireAdmin(req?: Request, perm?: Perm) {
  const u = await getSessionUser(req);
  if (!u) throw new HttpError(401, "No autenticado");
  if (perm && !can(u, perm)) throw new HttpError(403, "Tu rol no tiene permiso para esto");
  return u;
}
// Para páginas del panel (redirige en vez de lanzar error)
export async function requirePage(perm: Perm) {
  const u = await getSessionUser();
  if (!u) redirect("/admin/login");
  if (!can(u, perm)) redirect("/admin?sinpermiso=1");
  return u;
}
export async function audit(u: { id: string; name: string }, action: string, detail?: string) {
  await prisma.auditLog.create({ data: { staffId: u.id, staffName: u.name, action, detail: detail?.slice(0, 500) } }).catch(() => {});
}

export const handle = <C = unknown>(fn: (req: Request, ctx: C) => Promise<Response>) =>
  async (req: Request, ctx: C) => {
    try { return await fn(req, ctx); }
    catch (e) {
      if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
      if (e instanceof ZodError) return Response.json({ error: "Datos inválidos", details: e.flatten() }, { status: 400 });
      console.error(e);
      return Response.json({ error: "Error interno" }, { status: 500 });
    }
  };
