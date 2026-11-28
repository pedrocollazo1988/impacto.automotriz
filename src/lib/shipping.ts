import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "./prisma";
import { HttpError } from "./auth";
import { SITE } from "./site";
import { calcularTarifaEntrega } from "./shipping-fee";
import { textoMensaje, type IdiomaMensaje } from "./mensajes";
import { descripcionEntrega, nombreEntrega } from "./datos-i18n";

const num = (v: unknown) => (v == null ? null : Number(v));

// Punto de recogida por defecto cuando todavía no se han creado puntos en el panel.
// La dirección postal no cambia con el idioma; el nombre y el horario sí.
const PUNTO_TIENDA = { id: 0, address: SITE.direccion, readyHours: 24 } as const;
const NOMBRE_PUNTO: Record<IdiomaMensaje, string> = { es: "Recogida en tienda", en: "Store pickup" };
const HORARIO_PUNTO: Record<IdiomaMensaje, string> = { es: SITE.horario, en: SITE.horarioEn };

const puntoTienda = (idioma: IdiomaMensaje) => ({
  ...PUNTO_TIENDA,
  name: NOMBRE_PUNTO[idioma],
  hours: HORARIO_PUNTO[idioma],
});

// Calcula qué métodos de entrega están disponibles para un municipio y a qué precio.
// Prioridad: regla del municipio > regla de la provincia > tarifa base del método.
// Una regla con available=false bloquea expresamente esa zona.
export async function quoteDelivery(municipalityId: number, subtotalUsd: number, idioma: IdiomaMensaje = "es") {
  const mun = await prisma.municipality.findUnique({ where: { id: municipalityId } });
  if (!mun) return [];
  const [methods, points] = await Promise.all([
    prisma.deliveryMethod.findMany({
      where: { active: true }, orderBy: { sortOrder: "asc" },
      include: {
        rules: { where: { provinceId: mun.provinceId, OR: [{ municipalityId: mun.id }, { municipalityId: null }] } },
        slots: { where: { active: true }, orderBy: { startMin: "asc" } },
      },
    }),
    prisma.pickupPoint.findMany({ where: { active: true }, orderBy: { sortOrder: "asc" } }),
  ]);

  return methods.map((m) => {
    const base = {
      methodId: m.id, code: m.code, name: nombreEntrega(m, idioma), kind: m.kind,
      description: descripcionEntrega(m, idioma),
      requiresAddress: m.requiresAddress, cashOnDelivery: m.cashOnDelivery,
      slots: m.slots.map((s) => ({ id: s.id, label: s.label, maxOrders: s.maxOrders })),
      pickupPoints: [] as { id: number; name: string; address: string; hours: string | null; readyHours: number }[],
      etaMinDays: m.etaMinDays, etaMaxDays: m.etaMaxDays,
    };
    if (m.kind === "STORE_PICKUP") {
      const pp = points.length
        ? points.map((p) => ({ id: p.id, name: p.name, address: p.address, hours: p.hours, readyHours: p.readyHours }))
        : [puntoTienda(idioma)];
      return { ...base, pickupPoints: pp, available: true, feeUsd: Number(m.baseFee), reason: undefined };
    }
    const rule = m.rules.find((r) => r.municipalityId === mun.id) ?? m.rules.find((r) => r.municipalityId === null);
    if (rule && !rule.available) return { ...base, available: false, feeUsd: 0, reason: textoMensaje("msg.envio.noDisponible", idioma) };
    const min = num(rule?.minOrderUsd);
    if (min != null && subtotalUsd < min) return { ...base, available: false, feeUsd: 0, reason: textoMensaje("msg.envio.pedidoMinimo", idioma).replace("{min}", String(min)) };
    const fee = calcularTarifaEntrega({
      baseFee: m.baseFee,
      ruleFee: rule?.feeUsd,
      // La regla de zona manda sobre el umbral general del método.
      freeFromUsd: num(rule?.freeFromUsd) || num(m.freeFromUsd),
      subtotalUsd,
    });
    return { ...base, available: true, feeUsd: fee, etaMinDays: rule?.etaMinDays ?? m.etaMinDays, etaMaxDays: rule?.etaMaxDays ?? m.etaMaxDays, reason: undefined };
  });
}

export const deliveryInput = z.object({
  municipalityId: z.number().int(), methodId: z.number().int(),
  address: z.string().max(300).optional(), reference: z.string().max(200).optional(),
  recipientName: z.string().min(2).max(120), recipientPhone: z.string().min(6).max(25),
  recipientCi: z.string().max(20).optional(), isGift: z.boolean().default(false),
  slotId: z.number().int().optional(), scheduledDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/).optional(),
  pickupPointId: z.number().int().optional(),
});

// USAR EN EL CHECKOUT (servidor): revalida todo y recalcula el costo; nunca confiar en el navegador.
// `subtotalUsd` debe calcularse en el servidor a partir del carrito.
export async function buildOrderDelivery(input: z.infer<typeof deliveryInput>, subtotalUsd: number, idioma: IdiomaMensaje = "es") {
  const q = (await quoteDelivery(input.municipalityId, subtotalUsd, idioma)).find((x) => x.methodId === input.methodId);
  if (!q || !q.available) throw new HttpError(422, q?.reason ?? textoMensaje("msg.envio.metodoNoDisponible", idioma));
  if (q.requiresAddress && !input.address) throw new HttpError(422, textoMensaje("msg.envio.faltaDireccion", idioma));
  if (q.kind === "STORE_PICKUP" && q.pickupPoints.length > 0 && !q.pickupPoints.some((p) => p.id === input.pickupPointId)) throw new HttpError(422, textoMensaje("msg.envio.eligePunto", idioma));
  let scheduledDate: Date | undefined;
  if (input.slotId) {
    const slot = q.slots.find((s) => s.id === input.slotId);
    if (!slot || !input.scheduledDate) throw new HttpError(422, textoMensaje("msg.envio.franjaInvalida", idioma));
    scheduledDate = new Date(`${input.scheduledDate}T00:00:00Z`);
    const used = await prisma.orderDelivery.count({ where: { slotId: slot.id, scheduledDate, status: { not: "FAILED" } } });
    if (used >= slot.maxOrders) throw new HttpError(409, textoMensaje("msg.envio.franjaCompleta", idioma));
  }
  const mun = await prisma.municipality.findUniqueOrThrow({ where: { id: input.municipalityId } });
  return {
    methodId: q.methodId, methodName: q.name, kind: q.kind, provinceId: mun.provinceId, municipalityId: mun.id,
    address: input.address, reference: input.reference, recipientName: input.recipientName,
    recipientPhone: input.recipientPhone, recipientCi: input.recipientCi, isGift: input.isGift,
    slotId: input.slotId, scheduledDate, pickupPointId: input.pickupPointId && input.pickupPointId > 0 ? input.pickupPointId : undefined, feeUsd: q.feeUsd,
    cashOnDelivery: q.cashOnDelivery,
    confirmationCode: String(crypto.randomInt(100000, 1000000)), // PIN de entrega
  };
}
