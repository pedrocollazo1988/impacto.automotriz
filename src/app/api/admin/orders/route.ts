import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { sendTransactional } from "@/lib/mailer";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string(), value: z.enum(["PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELED"]) }),
  z.object({ action: z.literal("confirm-payment"), id: z.string() }),            // transferencia / efectivo
  z.object({ action: z.literal("deliver"), id: z.string(), pin: z.string().length(6) }), // valida PIN de entrega
]);

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "orders");
  const b = Body.parse(await req.json());
  const o = await prisma.order.findUniqueOrThrow({ where: { id: b.id }, include: { items: true, delivery: true } });

  if (b.action === "confirm-payment") {
    await prisma.order.update({ where: { id: o.id }, data: { paid: true, paidAt: new Date(), status: "PAID" } });
  } else if (b.action === "deliver") {
    if (o.delivery?.confirmationCode !== b.pin) throw new HttpError(422, "PIN incorrecto");
    await prisma.$transaction([
      prisma.order.update({ where: { id: o.id }, data: { status: "DELIVERED" } }),
      prisma.orderDelivery.update({ where: { orderId: o.id }, data: { status: "DELIVERED", deliveredAt: new Date() } }),
    ]);
  } else {
    if (o.status === "CANCELED") throw new HttpError(409, "El pedido ya está cancelado");
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: o.id }, data: { status: b.value } });
      if (b.value === "CANCELED") { // devolver existencias y uso del cupón
        for (const i of o.items) {
          await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.qty } } });
          if (i.variantId) await tx.productVariant.updateMany({ where: { id: i.variantId }, data: { stock: { increment: i.qty } } });
        }
        if (o.couponCode) await tx.coupon.updateMany({ where: { code: o.couponCode, used: { gt: 0 } }, data: { used: { decrement: 1 } } });
      }
    });
  }
  await audit(u, `pedido.${b.action}`, `#${o.number}${b.action === "status" ? " → " + b.value : ""}`);
  const label = b.action === "status" ? b.value : b.action === "deliver" ? "DELIVERED" : "PAID";
  sendTransactional(o.customerEmail, `Pedido #${o.number}: ${label}`, `<p>El estado de tu pedido #${o.number} cambió a <b>${label}</b>. Seguimiento: ${process.env.PUBLIC_URL}/pedido/${o.id}</p>`).catch(() => {});
  return Response.json({ ok: true });
});
