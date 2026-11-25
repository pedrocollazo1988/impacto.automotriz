import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { sendTransactional } from "@/lib/mailer";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string(), value: z.enum(["PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELED"]) }),
  z.object({ action: z.literal("confirm-payment"), id: z.string() }),            // transferencia / efectivo
  z.object({ action: z.literal("deliver"), id: z.string(), pin: z.string().length(6) }), // valida PIN de entrega
  z.object({ action: z.literal("remove-item"), id: z.string(), itemId: z.number().int().positive(), reason: z.string().min(3).max(200) }),
]);

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "orders");
  const b = Body.parse(await req.json());
  const o = await prisma.order.findUniqueOrThrow({ where: { id: b.id }, include: { items: true, delivery: true } });

  if (b.action === "remove-item") {
    if (u.role !== "ADMIN") throw new HttpError(403, "Solo el administrador puede retirar productos de un pedido.");
    if (o.status === "CANCELED" || o.status === "DELIVERED") throw new HttpError(409, "No se puede modificar un pedido cancelado o entregado.");
    const item = o.items.find((i) => i.id === b.itemId);
    if (!item) throw new HttpError(404, "Ese producto no pertenece al pedido.");
    if (o.items.length <= 1) throw new HttpError(409, "El pedido debe conservar al menos un producto. Cancela el pedido completo si ya no se puede servir.");
    const r2 = (n: number) => Math.round(n * 100) / 100;
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.delete({ where: { id: item.id } });
      await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } } });
      if (item.variantId) await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.qty } } });
      const rest = o.items.filter((i) => i.id !== item.id);
      const subtotal = r2(rest.reduce((s, i) => s + Number(i.unitUsd) * i.qty, 0));
      const discount = r2(Math.min(Number(o.discountUsd), subtotal));
      const total = r2(Math.max(0, subtotal - discount + Number(o.shippingUsd) + Number(o.paymentFeeUsd)));
      await tx.order.update({ where: { id: o.id }, data: { subtotalUsd: subtotal, discountUsd: discount, totalUsd: total } });
    });
    await audit(u, "pedido.quitar-producto", `#${o.number} · ${item.name} × ${item.qty} · ${b.reason}`);
    await sendTransactional(o.customerEmail, `Pedido #${o.number}: producto retirado`, `<p>Retiramos <b>${item.name}</b> (${item.qty} unidad${item.qty === 1 ? "" : "es"}) de tu pedido #${o.number}.</p><p>Motivo: <b>${b.reason}</b>.</p><p>El total se actualizó. Si tienes dudas, responde a este correo.</p>`);
    return Response.json({ ok: true });
  }

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
  await sendTransactional(o.customerEmail, `Pedido #${o.number}: ${label}`, `<p>El estado de tu pedido #${o.number} cambió a <b>${label}</b>. Seguimiento: ${process.env.PUBLIC_URL}/pedido/${o.id}</p>`);
  return Response.json({ ok: true });
});
