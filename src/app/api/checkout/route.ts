import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { priceCart } from "@/lib/pricing";
import { buildOrderDelivery, deliveryInput } from "@/lib/shipping";
import { evaluateCoupon } from "@/lib/coupons";
import { getCustomer } from "@/lib/customer-auth";
import { createOnlinePayment } from "@/lib/payments";
import { leerPasarelas } from "@/lib/payment-gateways";
import { comision } from "@/lib/pasarelas";
import { sendTransactional } from "@/lib/mailer";
import { orderToken, rememberOrder } from "@/lib/order-access";

const Body = z.object({
  items: z.array(z.object({ productId: z.number().int(), variantId: z.number().int().nullish(), qty: z.number().int().min(1).max(99) })).min(1).max(50),
  customer: z.object({ name: z.string().min(2).max(120), email: z.string().email().max(160), phone: z.string().min(6).max(25) }),
  delivery: deliveryInput,
  paymentMethod: z.enum(["TROPIPAY", "QVAPAY", "TRANSFER", "CASH"]),
  coupon: z.string().max(30).optional(),
});
const r2 = (n: number) => Math.round(n * 100) / 100;

export const POST = handle(async (req: Request) => {
  const b = Body.parse(await req.json());
  // 1) Todo se recalcula en el servidor: precios, existencias, cupón y envío.
  const cart = await priceCart(b.items);
  if (!cart.allOk) throw new HttpError(409, "Algún producto ya no está disponible en la cantidad pedida");
  const coupon = await evaluateCoupon(b.coupon, cart.subtotalUsd);
  const { cashOnDelivery, ...delivery } = await buildOrderDelivery(b.delivery, r2(cart.subtotalUsd - coupon.discountUsd));
  if (b.paymentMethod === "CASH" && !cashOnDelivery) throw new HttpError(422, "Este método de entrega no admite pago en efectivo");
  const baseUsd = r2(cart.subtotalUsd - coupon.discountUsd + delivery.feeUsd);
  // La pasarela la define el panel: si está desactivada, fuera de rango o sin
  // credenciales, no se acepta el pedido con ese método (evita saltarse el panel).
  const pasarelas = await leerPasarelas();
  const gw = pasarelas.find((p) => p.key === b.paymentMethod);
  if (!gw || !gw.enabled) throw new HttpError(422, "Ese método de pago no está disponible");
  if (gw.minTotalUsd != null && baseUsd < gw.minTotalUsd) throw new HttpError(422, `Ese método requiere un mínimo de ${gw.minTotalUsd} USD`);
  if (gw.maxTotalUsd != null && baseUsd > gw.maxTotalUsd) throw new HttpError(422, `Ese método admite hasta ${gw.maxTotalUsd} USD`);
  if (gw.kind === "online" && !gw.creds) throw new HttpError(422, "Ese método de pago no está configurado todavía");
  const feeUsd = comision(gw, baseUsd);
  const totalUsd = r2(baseUsd + feeUsd);
  const me = await getCustomer();

  // 2) Pedido + stock + cupón en una sola transacción (si algo falla, se revierte todo).
  const order = await prisma.$transaction(async (tx) => {
    for (const l of cart.lines) {
      if (l.variantId) { // el stock del producto es la suma de sus variantes: se descuentan ambos
        const rv = await tx.productVariant.updateMany({ where: { id: l.variantId, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
        if (rv.count === 0) throw new HttpError(409, `Sin existencias suficientes: ${l.name}`);
      }
      const r = await tx.product.updateMany({ where: { id: l.productId, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
      if (r.count === 0) throw new HttpError(409, `Sin existencias suficientes: ${l.name}`);
    }
    if (coupon.id) {
      const r = await tx.coupon.updateMany({ where: { id: coupon.id, ...(coupon.maxUses != null ? { used: { lt: coupon.maxUses } } : {}) }, data: { used: { increment: 1 } } });
      if (r.count === 0) throw new HttpError(422, "Cupón agotado");
    }
    return tx.order.create({
      data: {
        paymentMethod: b.paymentMethod, customerName: b.customer.name, customerEmail: b.customer.email, customerPhone: b.customer.phone, customerId: me?.id,
        subtotalUsd: cart.subtotalUsd, discountUsd: coupon.discountUsd, couponCode: coupon.code, shippingUsd: delivery.feeUsd, paymentFeeUsd: feeUsd, totalUsd,
        items: { create: cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.name, unitUsd: l.unitUsd, qty: l.qty })) },
        delivery: { create: delivery },
      },
    });
  });

  // 3) Pago en línea (si falla, el pedido queda pendiente y se puede reintentar desde /pedido/[id]).
  let paymentUrl: string | null = null;
  if (b.paymentMethod === "TROPIPAY" || b.paymentMethod === "QVAPAY") {
    try { const pay = await createOnlinePayment({ id: order.id, number: order.number, totalUsd, method: b.paymentMethod }); paymentUrl = pay.url; await prisma.order.update({ where: { id: order.id }, data: { paymentRef: pay.url, providerRef: pay.ref } }); }
    catch (e) { console.error("Pasarela:", e); }
  }
  sendTransactional(b.customer.email, `Pedido #${order.number} recibido`,
    `<p>Hola ${b.customer.name.replace(/[<>&]/g, "")}, recibimos tu pedido <b>#${order.number}</b> por <b>${totalUsd.toFixed(2)} USD</b>.</p><p>PIN de entrega: <b>${delivery.confirmationCode}</b> (dáselo a quien entrega para confirmar la recepción).</p><p>Seguimiento: ${process.env.PUBLIC_URL}/pedido/${order.id}?t=${orderToken(order.id)}</p>`).catch(() => {});
  await rememberOrder(order.id);
  return Response.json({ orderId: order.id, paymentUrl });
});
