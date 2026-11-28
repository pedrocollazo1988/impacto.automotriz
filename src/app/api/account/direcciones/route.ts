import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { requireCustomer } from "@/lib/customer-auth";
import { limit } from "@/lib/ratelimit";
import { geoValida } from "@/lib/direcciones-server";
import {
  MAX_DIRECCIONES, aGuardar, normalizarDireccion, ordenarDirecciones, validarDireccion, type ErroresDireccion,
} from "@/lib/direcciones";

const Campos = z.object({
  label: z.string().max(24).optional().default(""),
  recipientName: z.string().max(80),
  recipientPhone: z.string().max(30),
  provinceId: z.number().int(),
  municipalityId: z.number().int(),
  address: z.string().max(160),
  reference: z.string().max(120).optional().default(""),
});

const primero = (e: ErroresDireccion) => Object.values(e)[0] ?? "dir.errGeneral";

export const GET = handle(async () => {
  const c = await requireCustomer();
  const lista = await prisma.address.findMany({ where: { customerId: c.id } });
  return Response.json(ordenarDirecciones(lista));
});

export const POST = handle(async (req: Request) => {
  const c = await requireCustomer();
  await limit(req, "direcciones", 30);
  const b = Campos.parse(await req.json());
  const geo = await geoValida(b.provinceId, b.municipalityId);
  const errores = validarDireccion(normalizarDireccion({ ...b, ...geo }));
  if (Object.keys(errores).length) throw new HttpError(400, primero(errores));
  const datos = aGuardar(normalizarDireccion({ ...b, ...geo }));
  if (!datos) throw new HttpError(400, "dir.errGeneral");

  const cuantas = await prisma.address.count({ where: { customerId: c.id } });
  if (cuantas >= MAX_DIRECCIONES) throw new HttpError(409, "dir.errLimit");

  const creada = await prisma.address.create({
    data: { ...datos, customerId: c.id, isDefault: cuantas === 0 },
  });
  return Response.json(creada, { status: 201 });
});
