import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { getSessionUser, handle, HttpError } from "@/lib/auth";

const Tema = z.enum(["light", "dark", "system"]);

export const GET = handle(async () => {
  const u = await getSessionUser();
  if (!u) return Response.json({ theme: null });
  const fila = await prisma.staffUser.findUnique({ where: { id: u.id }, select: { theme: true } });
  return Response.json({ theme: fila?.theme ?? null });
});

export const PATCH = handle(async (req: Request) => {
  const u = await getSessionUser();
  if (!u) throw new HttpError(401, "Sesión requerida");
  const { theme } = z.object({ theme: Tema }).parse(await req.json());
  await prisma.staffUser.update({ where: { id: u.id }, data: { theme } });
  return Response.json({ ok: true });
});
