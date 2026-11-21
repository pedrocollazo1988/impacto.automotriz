import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { asegurarPasarelas, cifrar, descifrar, limpiarCreds } from "@/lib/payment-gateways";
import { CLAVES, CAMPOS } from "@/lib/pasarelas";

// Gestión de pasarelas desde el panel. Nunca se devuelven credenciales en claro:
// solo si están puestas.

const Body = z.object({
  key: z.enum(["TROPIPAY", "QVAPAY", "TRANSFER", "CASH"]),
  name: z.string().min(2).max(60).optional(),
  description: z.string().max(200).optional(),
  enabled: z.boolean().optional(),
  sandbox: z.boolean().optional(),
  sortOrder: z.number().int().min(0).max(99).optional(),
  instructions: z.string().max(2000).optional(),
  feePercent: z.number().min(0).max(30).optional(),
  minTotalUsd: z.number().min(0).nullish(),
  maxTotalUsd: z.number().min(0).nullish(),
  creds: z.record(z.string(), z.string()).optional(),
});

export const GET = handle(async (req: Request) => {
  await requireAdmin(req, "payments");
  await asegurarPasarelas();
  const filas = await prisma.paymentGateway.findMany({ orderBy: { sortOrder: "asc" } });
  return Response.json(filas.map((f) => {
    const creds = descifrar(f.credsEnc) ?? {};
    return {
      key: f.key, name: f.name, description: f.description, kind: f.kind, enabled: f.enabled, sandbox: f.sandbox,
      sortOrder: f.sortOrder, instructions: f.instructions, feePercent: Number(f.feePercent),
      minTotalUsd: f.minTotalUsd == null ? null : Number(f.minTotalUsd),
      maxTotalUsd: f.maxTotalUsd == null ? null : Number(f.maxTotalUsd),
      updatedAt: f.updatedAt,
      // Solo si hay valor, jamás el valor.
      creds: Object.fromEntries(CAMPOS[f.key as keyof typeof CAMPOS].map((c) => [c.campo, creds[c.campo] ? "definido" : ""])),
    };
  }));
});

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "payments");
  const b = Body.parse(await req.json());
  if (b.minTotalUsd != null && b.maxTotalUsd != null && b.minTotalUsd > b.maxTotalUsd) throw new HttpError(422, "El mínimo no puede superar al máximo");
  const actual = await prisma.paymentGateway.findUnique({ where: { key: b.key } });
  if (!actual) throw new HttpError(404, "Pasarela desconocida");

  // Las credenciales se mezclan con las guardadas: un campo vacío NO borra lo que
  // había, para no perder un secreto por dejar un input en blanco.
  const previas = descifrar(actual.credsEnc) ?? {};
  const mezcla = { ...previas, ...(b.creds ? limpiarCreds(b.key, b.creds) : {}) };

  const row = await prisma.paymentGateway.update({
    where: { key: b.key },
    data: {
      name: b.name ?? actual.name,
      description: b.description ?? actual.description,
      enabled: b.enabled ?? actual.enabled,
      sandbox: b.sandbox ?? actual.sandbox,
      sortOrder: b.sortOrder ?? actual.sortOrder,
      instructions: b.instructions ?? actual.instructions,
      feePercent: b.feePercent ?? actual.feePercent,
      minTotalUsd: b.minTotalUsd === undefined ? actual.minTotalUsd : b.minTotalUsd,
      maxTotalUsd: b.maxTotalUsd === undefined ? actual.maxTotalUsd : b.maxTotalUsd,
      credsEnc: Object.keys(mezcla).length ? cifrar(mezcla) : null,
    },
  });
  await audit(u, "pago.configurar", `${row.key}${b.enabled === undefined ? "" : b.enabled ? " activada" : " desactivada"}`);
  return Response.json({ ok: true });
});

// Vaciar las credenciales de una pasarela (revocarlas) y dejarla desactivada.
export const DELETE = handle(async (req: Request) => {
  const u = await requireAdmin(req, "payments");
  const key = new URL(req.url).searchParams.get("key");
  if (!key || !CLAVES.includes(key as never)) throw new HttpError(400, "Clave no válida");
  await prisma.paymentGateway.update({ where: { key }, data: { credsEnc: null, enabled: false } });
  await audit(u, "pago.revocar", key);
  return Response.json({ ok: true });
});
