import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-auth";
import { limit } from "@/lib/ratelimit";
import { aGuardar, normalizarDireccion, principalTrasBorrar, validarDireccion } from "@/lib/direcciones";
import { geoValida } from "@/lib/direcciones-server";

const Campos = z.object({
  label: z.string().max(24).optional().default(""),
  recipientName: z.string().max(80),
  recipientPhone: z.string().max(30),
  provinceId: z.number().int(),
  municipalityId: z.number().int(),
  address: z.string().max(160),
  reference: z.string().max(120).optional().default(""),
  principal: z.boolean().optional(),
});

type Ctx = { params: Promise<{ id: string }> };
const idDe = async (ctx: Ctx) => Number((await ctx.params).id);

export const PATCH = handle<Ctx>(async (req, ctx) => {
  const c = await requireCustomer();
  await limit(req, "direcciones", 30);
  const id = await idDe(ctx);
  const existe = await prisma.address.findFirst({ where: { id, customerId: c.id } });
  if (!existe) throw new HttpError(404, "dir.errNotFound");

  const b = Campos.parse(await req.json());
  const geo = await geoValida(b.provinceId, b.municipalityId);
  const errores = validarDireccion(normalizarDireccion({ ...b, ...geo }));
  if (Object.keys(errores).length) throw new HttpError(400, Object.values(errores)[0] ?? "dir.errGeneral");
  const datos = aGuardar(normalizarDireccion({ ...b, ...geo }));
  if (!datos) throw new HttpError(400, "dir.errGeneral");

  await prisma.$transaction([
    ...(b.principal ? [prisma.address.updateMany({ where: { customerId: c.id }, data: { isDefault: false } })] : []),
    prisma.address.update({
      where: { id },
      data: { ...datos, isDefault: b.principal ? true : existe.isDefault },
    }),
  ]);
  return Response.json({ ok: true });
});

export const DELETE = handle<Ctx>(async (_req, ctx) => {
  const c = await requireCustomer();
  const id = await idDe(ctx);
  const lista = await prisma.address.findMany({ where: { customerId: c.id }, select: { id: true, isDefault: true, updatedAt: true } });
  if (!lista.some((d) => d.id === id)) throw new HttpError(404, "dir.errNotFound");

  const nuevaPrincipal = principalTrasBorrar(lista, id);
  await prisma.$transaction([
    prisma.address.delete({ where: { id } }),
    ...(nuevaPrincipal ? [prisma.address.update({ where: { id: nuevaPrincipal }, data: { isDefault: true } })] : []),
  ]);
  return Response.json({ ok: true });
});
