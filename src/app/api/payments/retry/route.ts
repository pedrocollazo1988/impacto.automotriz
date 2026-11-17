import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { createOnlinePayment } from "@/lib/payments";
import { limit } from "@/lib/ratelimit";

// Reintento de pago en línea desde la página del pedido (Tropipay o QvaPay).
export const POST = handle(async (req: Request) => {
  await limit(req, "pay-retry", 10);
  const { orderId } = z.object({ orderId: z.string().max(40) }).parse(await req.json());
  const o = await prisma.order.findUnique({ where: { id: orderId } });
  if (!o || (o.paymentMethod !== "TROPIPAY" && o.paymentMethod !== "QVAPAY") || o.paid || o.status === "CANCELED") throw new HttpError(409, "Este pedido no admite pago en línea");
  const p = await createOnlinePayment({ id: o.id, number: o.number, totalUsd: Number(o.totalUsd), method: o.paymentMethod });
  await prisma.order.update({ where: { id: o.id }, data: { paymentRef: p.url, providerRef: p.ref ?? o.providerRef } });
  return Response.json({ paymentUrl: p.url });
});
