import { z } from "zod";
import { prisma, asegurarEsquema } from "@/lib/prisma";
import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { notifyBackInStock, sendTransactional } from "@/lib/mailer";
import { orderItemRemovedEmail, orderStatusEmail } from "@/lib/email-templates";
import { emailLang, emailT, orderStatusEmailLabel } from "@/lib/email-i18n";
import { orderToken } from "@/lib/order-access";

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("status"), id: z.string(), value: z.enum(["PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELED"]) }),
  z.object({ action: z.literal("confirm-payment"), id: z.string() }),            // transferencia / efectivo
  z.object({ action: z.literal("deliver"), id: z.string(), pin: z.string().length(6) }), // valida PIN de entrega
  z.object({ action: z.literal("remove-item"), id: z.string(), itemId: z.number().int().positive(), reason: z.string().min(3).max(200) }),
]);

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "orders");
  await asegurarEsquema();
  const b = Body.parse(await req.json());
  const o = await prisma.order.findUniqueOrThrow({ where: { id: b.id }, include: { items: true, delivery: true } });
  const reposiciones = new Map<number, { name: string; slug: string }>();

  if (b.action === "remove-item") {
    if (u.role !== "ADMIN") throw new HttpError(403, "Solo el administrador puede retirar productos de un pedido.");
    if (o.status === "CANCELED" || o.status === "DELIVERED") throw new HttpError(409, "No se puede modificar un pedido cancelado o entregado.");
    const item = o.items.find((i) => i.id === b.itemId);
    if (!item) throw new HttpError(404, "Ese producto no pertenece al pedido.");
    if (o.items.length <= 1) throw new HttpError(409, "El pedido debe conservar al menos un producto. Cancela el pedido completo si ya no se puede servir.");
    const r2 = (n: number) => Math.round(n * 100) / 100;
    await prisma.$transaction(async (tx) => {
      await tx.orderItem.delete({ where: { id: item.id } });
      const prod = await tx.product.update({ where: { id: item.productId }, data: { stock: { increment: item.qty } }, select: { stock: true, sku: true, name: true, slug: true } });
      if (prod.stock - item.qty <= 0 && prod.stock > 0) reposiciones.set(item.productId, { name: prod.name, slug: prod.slug });
      if (item.variantId) await tx.productVariant.updateMany({ where: { id: item.variantId }, data: { stock: { increment: item.qty } } });
      await tx.productMovement.create({
        data: {
          productId: item.productId, variantId: item.variantId, productName: prod.name, sku: prod.sku,
          kind: "DEVOLUCION", delta: item.qty, stockBefore: prod.stock - item.qty, stockAfter: prod.stock,
          detail: `Retirado del pedido #${o.number}: ${item.name}`, orderId: o.id, orderNumber: o.number,
          actor: u.name, source: "admin",
        },
      });
      const rest = o.items.filter((i) => i.id !== item.id);
      const subtotal = r2(rest.reduce((s, i) => s + Number(i.unitUsd) * i.qty, 0));
      const discount = r2(Math.min(Number(o.discountUsd), subtotal));
      const total = r2(Math.max(0, subtotal - discount + Number(o.shippingUsd) + Number(o.paymentFeeUsd)));
      await tx.order.update({ where: { id: o.id }, data: { subtotalUsd: subtotal, discountUsd: discount, totalUsd: total } });
    });
    await audit(u, "pedido.quitar-producto", `#${o.number} · ${item.name} × ${item.qty} · ${b.reason}`);
    const lang = emailLang(o.lang);
    const actualizado = await prisma.order.findUnique({ where: { id: o.id }, select: { totalUsd: true } });
    await sendTransactional(o.customerEmail, emailT(lang, "removed.subject", { number: o.number }), orderItemRemovedEmail({
      name: o.customerName, orderNumber: o.number, itemName: item.name, qty: item.qty, reason: b.reason,
      total: actualizado ? `${Number(actualizado.totalUsd).toFixed(2)} USD` : undefined,
      trackingUrl: `${process.env.PUBLIC_URL}/pedido/${o.id}?t=${orderToken(o.id)}`, lang,
    }));
    return Response.json({ ok: true });
  }

  if (b.action === "confirm-payment") {
    await prisma.order.update({ where: { id: o.id }, data: { paid: true, paidAt: new Date(), status: "PAID" } });
  } else if (b.action === "deliver") {
    if (o.status === "CANCELED") throw new HttpError(409, "No se puede entregar un pedido cancelado");
    if (o.status === "DELIVERED") throw new HttpError(409, "El pedido ya está entregado");
    if (o.delivery?.confirmationCode !== b.pin) throw new HttpError(422, "PIN incorrecto");
    await prisma.$transaction([
      prisma.order.update({ where: { id: o.id }, data: { status: "DELIVERED" } }),
      prisma.orderDelivery.update({ where: { orderId: o.id }, data: { status: "DELIVERED", deliveredAt: new Date() } }),
    ]);
  } else {
    if (o.status === "CANCELED") throw new HttpError(409, "El pedido ya está cancelado");
    if (b.value === "DELIVERED") throw new HttpError(400, "Confirma la entrega con el PIN del cliente.");
    await prisma.$transaction(async (tx) => {
      await tx.order.update({ where: { id: o.id }, data: { status: b.value } });
      if (b.value === "CANCELED") { // devolver existencias y uso del cupón
        for (const i of o.items) {
          const prod = await tx.product.update({ where: { id: i.productId }, data: { stock: { increment: i.qty } }, select: { stock: true, sku: true, name: true, slug: true } });
          if (prod.stock - i.qty <= 0 && prod.stock > 0) reposiciones.set(i.productId, { name: prod.name, slug: prod.slug });
          if (i.variantId) await tx.productVariant.updateMany({ where: { id: i.variantId }, data: { stock: { increment: i.qty } } });
          await tx.productMovement.create({
            data: {
              productId: i.productId, variantId: i.variantId, productName: prod.name, sku: prod.sku,
              kind: "CANCELACION", delta: i.qty, stockBefore: prod.stock - i.qty, stockAfter: prod.stock,
              detail: `Pedido #${o.number} cancelado: ${i.name}`, orderId: o.id, orderNumber: o.number,
              actor: u.name, source: "admin",
            },
          });
        }
        if (o.couponCode) await tx.coupon.updateMany({ where: { code: o.couponCode, used: { gt: 0 } }, data: { used: { decrement: 1 } } });
      }
    });
  }
  const base = (process.env.PUBLIC_URL ?? "https://impacto-automotriz.vercel.app").replace(/\/+$/, "");
  for (const [productId, p] of reposiciones) {
    await notifyBackInStock(String(productId), p.name, `${base}/producto/${p.slug}`).catch(() => {});
  }
  await audit(u, `pedido.${b.action}`, `#${o.number}${b.action === "status" ? " → " + b.value : ""}`);
  const estado = b.action === "status" ? b.value : b.action === "deliver" ? "DELIVERED" : "PAID";
  const lang = emailLang(o.lang);
  const label = orderStatusEmailLabel(lang, estado);
  await sendTransactional(o.customerEmail, emailT(lang, "status.subject", { number: o.number, status: label }), orderStatusEmail({
    name: o.customerName, orderNumber: o.number, status: estado,
    trackingUrl: `${process.env.PUBLIC_URL}/pedido/${o.id}?t=${orderToken(o.id)}`,
    deliveryPin: ["PAID", "PREPARING", "SHIPPED"].includes(estado) ? o.delivery?.confirmationCode : undefined, lang,
  }));
  return Response.json({ ok: true });
});
