import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";

// GET ?vehicle=slug → láminas y pines de un vehículo; sin parámetro → todos los vehículos.
export const GET = handle(async (req: Request) => {
  await requireAdmin(req, "products");
  const slug = new URL(req.url).searchParams.get("vehicle");
  const vehicles = await prisma.vehicle.findMany({
    where: slug ? { slug } : {},
    orderBy: [{ sortOrder: "asc" }, { brand: "asc" }],
    include: {
      diagrams: {
        orderBy: { sortOrder: "asc" },
        include: {
          system: true,
          pins: {
            orderBy: { number: "asc" },
            include: { product: { select: { id: true, sku: true, name: true, stock: true } } },
          },
        },
      },
    },
  });
  return Response.json(vehicles);
});

const PinBody = z.object({
  diagramId: z.number().int(),
  productId: z.number().int(),
  number: z.number().int().min(1).max(999),
  x: z.number().min(0).max(100),
  y: z.number().min(0).max(100),
  svgId: z.string().max(60).nullish(),
  label: z.string().max(120).nullish(),
});

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const b = PinBody.parse(await req.json());
  const taken = await prisma.diagramPin.findFirst({ where: { diagramId: b.diagramId, number: b.number } });
  if (taken) throw new HttpError(409, `El número ${b.number} ya está usado en esta lámina`);
  const row = await prisma.diagramPin.create({ data: { ...b, svgId: b.svgId ?? null, label: b.label ?? null } });
  await audit(u, "despiece.pin.crear", `lámina ${b.diagramId} · nº ${b.number}`);
  return Response.json(row);
});

const PinPatch = z.object({
  id: z.number().int(),
  x: z.number().min(0).max(100).optional(),
  y: z.number().min(0).max(100).optional(),
  number: z.number().int().min(1).max(999).optional(),
  label: z.string().max(120).nullish(),
});

export const PATCH = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const { id, ...d } = PinPatch.parse(await req.json());
  if (d.number != null) {
    const pin = await prisma.diagramPin.findUnique({ where: { id } });
    if (!pin) throw new HttpError(404, "Pin no encontrado");
    const clash = await prisma.diagramPin.findFirst({ where: { diagramId: pin.diagramId, number: d.number, id: { not: id } } });
    if (clash) throw new HttpError(409, `El número ${d.number} ya está usado`);
  }
  const row = await prisma.diagramPin.update({ where: { id }, data: d });
  await audit(u, "despiece.pin.mover", String(id));
  return Response.json(row);
});

export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const id = Number(new URL(req.url).searchParams.get("id"));
  if (!id) throw new HttpError(400, "Falta id");
  await prisma.diagramPin.delete({ where: { id } });
  await audit(u, "despiece.pin.borrar", String(id));
  return Response.json({ ok: true });
});
