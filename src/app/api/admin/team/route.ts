import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

export const GET = handle(async (req: Request) => {
  await requireAdmin(req, "team");
  return Response.json(await prisma.staffUser.findMany({ orderBy: { createdAt: "asc" }, select: { id: true, email: true, name: true, role: true, active: true, lastLoginAt: true } }));
});

const Body = z.object({
  id: z.string().optional(), email: z.string().email().transform((s) => s.toLowerCase()), name: z.string().min(2).max(80),
  role: z.enum(["ADMIN", "MANAGER", "SALES", "WAREHOUSE"]), active: z.boolean().default(true), password: z.string().min(10).max(100).optional(),
});
export const POST = handle(async (req: Request) => {
  const me = await requireAdmin(req, "team");
  const { id, password, ...d } = Body.parse(await req.json());
  if (!id) {
    if (!password) throw new HttpError(400, "Indica una contraseña inicial (mínimo 10 caracteres)");
    const row = await prisma.staffUser.create({ data: { ...d, passwordHash: hashPassword(password) } });
    await audit(me, "equipo.crear", `${row.email} (${row.role})`);
    return Response.json({ id: row.id });
  }
  const cur = await prisma.staffUser.findUniqueOrThrow({ where: { id } });
  const losingAdmin = cur.role === "ADMIN" && cur.active && (d.role !== "ADMIN" || !d.active);
  if (losingAdmin && (await prisma.staffUser.count({ where: { role: "ADMIN", active: true } })) <= 1) throw new HttpError(409, "Debe quedar al menos un administrador activo");
  await prisma.staffUser.update({ where: { id }, data: { ...d, ...(password ? { passwordHash: hashPassword(password) } : {}) } });
  await audit(me, "equipo.editar", `${d.email} (${d.role}${d.active ? "" : ", desactivado"}${password ? ", nueva clave" : ""})`);
  return Response.json({ ok: true });
});
