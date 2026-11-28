import { prisma } from "./prisma";
import { HttpError } from "./auth";
import { textoMensaje, type IdiomaMensaje } from "./mensajes";

// Valida un cupón contra el subtotal y calcula el descuento (siempre en el servidor).
export async function evaluateCoupon(code: string | undefined, subtotal: number, idioma: IdiomaMensaje = "es") {
  if (!code?.trim()) return { discountUsd: 0, code: null as string | null, id: null as number | null, maxUses: null as number | null };
  const c = await prisma.coupon.findUnique({ where: { code: code.trim().toUpperCase() } });
  const now = new Date();
  if (!c || !c.active || (c.startsAt && c.startsAt > now) || (c.expiresAt && c.expiresAt < now) || (c.maxUses != null && c.used >= c.maxUses)) throw new HttpError(422, textoMensaje("msg.cupon.invalido", idioma));
  if (c.minSubtotalUsd != null && subtotal < Number(c.minSubtotalUsd)) throw new HttpError(422, textoMensaje("msg.cupon.minimo", idioma).replace("{min}", Number(c.minSubtotalUsd).toFixed(2)));
  const raw = c.percentOff ? (subtotal * c.percentOff) / 100 : Number(c.amountOffUsd ?? 0);
  return { discountUsd: Math.min(subtotal, Math.round(raw * 100) / 100), code: c.code, id: c.id, maxUses: c.maxUses };
}
