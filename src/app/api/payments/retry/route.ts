import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { createOnlinePayment } from "@/lib/payments";
import { porClave } from "@/lib/payment-gateways";
import { esCobroAutomatico } from "@/lib/pasarelas";
import { limit } from "@/lib/ratelimit";

// Reintento de pago en línea desde la página del pedido. El driver del método
// decide si se puede reintentar; no hay una lista fija de claves.
export const POST = handle(async (req: Request) => {
  await limit(req, "pay-retry", 10);
  const { orderId } = z.object({ orderId: z.string().max(40) }).parse(await req.json());
  const o = await prisma.order.findUnique({ where: { id: orderId } });
  if (!o || o.paid || o.status === "CANCELED") throw new HttpError(409, "Este pedido no admite pago en línea");
  const gw = await porClave(o.paymentMethod);
  if (!gw || !gw.enabled || gw.archived || !esCobroAutomatico(gw)) throw new HttpError(409, "Este pedido no admite pago en línea");
  const p = await createOnlinePayment({ id: o.id, number: o.number, totalUsd: Number(o.totalUsd), gateway: gw });
  await prisma.order.update({ where: { id: o.id }, data: { paymentRef: p.url, providerRef: p.ref ?? o.providerRef } });
  return Response.json({ paymentUrl: p.url });
});
