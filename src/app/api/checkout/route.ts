import { z } from "zod";
import { prisma, asegurarEsquema } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { priceCart } from "@/lib/pricing";
import { buildOrderDelivery, deliveryInput } from "@/lib/shipping";
import { evaluateCoupon } from "@/lib/coupons";
import { requireCustomer } from "@/lib/customer-auth";
import { createOnlinePayment } from "@/lib/payments";
import { leerPasarelas } from "@/lib/payment-gateways";
import { comision, esCobroAutomatico, estaOperativa, redirigeAlPagar, requiereContraEntrega } from "@/lib/pasarelas";
import { sendTransactional } from "@/lib/mailer";
import { adminOrderEmail, orderConfirmationEmail } from "@/lib/email-templates";
import { emailT } from "@/lib/email-i18n";
import { getLang } from "@/lib/i18n";
import { orderToken, rememberOrder } from "@/lib/order-access";
import { requireTurnstile } from "@/lib/turnstile";

const Body = z.object({
  items: z.array(z.object({ productId: z.number().int(), variantId: z.number().int().nullish(), qty: z.number().int().min(1).max(99) })).min(1).max(50),
  customer: z.object({ name: z.string().min(2).max(120), email: z.string().email().max(160), phone: z.string().min(6).max(25) }),
  delivery: deliveryInput,
  // La clave la crea el panel: no es un enum fijo.
  paymentMethod: z.string().min(1).max(40),
  coupon: z.string().max(30).optional(),
  turnstileToken: z.string().max(2048).optional(),
});
const r2 = (n: number) => Math.round(n * 100) / 100;

export const POST = handle(async (req: Request) => {
  const me = await requireCustomer(); // comprar exige una cuenta con sesión iniciada
  const b = Body.parse(await req.json());
  await requireTurnstile(req, b.turnstileToken);
  await asegurarEsquema();
  // 1) Todo se recalcula en el servidor: precios, existencias, cupón y envío.
  const cart = await priceCart(b.items);
  if (!cart.allOk) throw new HttpError(409, "Algún producto ya no está disponible en la cantidad pedida");
  const coupon = await evaluateCoupon(b.coupon, cart.subtotalUsd);
  const { cashOnDelivery, ...delivery } = await buildOrderDelivery(b.delivery, r2(cart.subtotalUsd - coupon.discountUsd));
  const baseUsd = r2(cart.subtotalUsd - coupon.discountUsd + delivery.feeUsd);
  // El método lo define el panel: si está desactivado, archivado, fuera de rango
  // o sin lo obligatorio, no se acepta el pedido con ese método.
  const pasarelas = await leerPasarelas();
  const gw = pasarelas.find((p) => p.key === b.paymentMethod);
  if (!gw || !gw.enabled || gw.archived) throw new HttpError(422, "Ese método de pago no está disponible");
  if (gw.minTotalUsd != null && baseUsd < gw.minTotalUsd) throw new HttpError(422, `Ese método requiere un mínimo de ${gw.minTotalUsd} USD`);
  if (gw.maxTotalUsd != null && baseUsd > gw.maxTotalUsd) throw new HttpError(422, `Ese método admite hasta ${gw.maxTotalUsd} USD`);
  if (!estaOperativa(gw, gw.creds)) throw new HttpError(422, "Ese método de pago no está configurado todavía");
  if (requiereContraEntrega(gw) && !cashOnDelivery) throw new HttpError(422, "Este método de entrega no admite pago contra entrega");
  const feeUsd = comision(gw, baseUsd);
  const totalUsd = r2(baseUsd + feeUsd);

  const lang = await getLang();
  // 2) Pedido + stock + cupón en una sola transacción (si algo falla, se revierte todo).
  const order = await prisma.$transaction(async (tx) => {
    // El pedido se crea primero para tener número y poder enlazar cada movimiento.
    const created = await tx.order.create({
      data: {
        paymentMethod: gw.key, paymentMethodName: gw.name, customerName: b.customer.name || me.name, customerEmail: me.email, customerPhone: b.customer.phone || me.phone || "", customerId: me.id, lang,
        subtotalUsd: cart.subtotalUsd, discountUsd: coupon.discountUsd, couponCode: coupon.code, shippingUsd: delivery.feeUsd, paymentFeeUsd: feeUsd, totalUsd,
        items: { create: cart.lines.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.name, unitUsd: l.unitUsd, qty: l.qty })) },
        delivery: { create: delivery },
      },
    });
    for (const l of cart.lines) {
      if (l.variantId) { // el stock del producto es la suma de sus variantes: se descuentan ambos
        const rv = await tx.productVariant.updateMany({ where: { id: l.variantId, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
        if (rv.count === 0) throw new HttpError(409, `Sin existencias suficientes: ${l.name}`);
      }
      const r = await tx.product.updateMany({ where: { id: l.productId, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
      if (r.count === 0) throw new HttpError(409, `Sin existencias suficientes: ${l.name}`);
      const after = await tx.product.findUnique({ where: { id: l.productId }, select: { stock: true, sku: true, name: true } });
      const stockAfter = after?.stock ?? 0;
      await tx.productMovement.create({
        data: {
          productId: l.productId, variantId: l.variantId ?? null, productName: after?.name ?? l.name, sku: after?.sku ?? "",
          kind: "VENTA", delta: -l.qty, stockBefore: stockAfter + l.qty, stockAfter,
          detail: `Pedido #${created.number}${l.variantId ? ` · variante #${l.variantId}` : ""}`,
          orderId: created.id, orderNumber: created.number, actor: me.name, source: "checkout",
        },
      });
    }
    if (coupon.id) {
      const r = await tx.coupon.updateMany({ where: { id: coupon.id, ...(coupon.maxUses != null ? { used: { lt: coupon.maxUses } } : {}) }, data: { used: { increment: 1 } } });
      if (r.count === 0) throw new HttpError(422, "Cupón agotado");
    }
    return created;
  });

  // 3) Pago en línea (si falla, el pedido queda pendiente y se puede reintentar desde /pedido/[id]).
  let paymentUrl: string | null = null;
  if (esCobroAutomatico(gw)) {
    try {
      const pay = await createOnlinePayment({ id: order.id, number: order.number, totalUsd, gateway: gw });
      paymentUrl = pay.url;
      await prisma.order.update({ where: { id: order.id }, data: { paymentRef: pay.url, providerRef: pay.ref } });
    } catch (e) {
      console.error("Pasarela:", e);
    }
  } else if (redirigeAlPagar(gw) && gw.config?.url) {
    paymentUrl = gw.config.url;
    await prisma.order.update({ where: { id: order.id }, data: { paymentRef: paymentUrl } });
  }
  await sendTransactional(me.email, emailT(lang, "order.subject", { number: order.number }), orderConfirmationEmail({
    name: b.customer.name || me.name,
    orderNumber: order.number,
    total: `${totalUsd.toFixed(2)} USD`,
    items: cart.lines.map((l) => ({ name: l.name, qty: l.qty, price: `${l.totalUsd.toFixed(2)} USD` })),
    trackingUrl: `${process.env.PUBLIC_URL}/pedido/${order.id}?t=${orderToken(order.id)}`,
    deliveryPin: delivery.confirmationCode,
    lang,
  }));
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (adminEmail) {
    await sendTransactional(adminEmail, emailT("es", "adminOrder.subject", { number: order.number }), adminOrderEmail({
      orderNumber: order.number,
      customerName: b.customer.name || me.name,
      customerEmail: me.email,
      total: `${totalUsd.toFixed(2)} USD`,
      items: cart.lines.map((l) => ({ name: l.name, qty: l.qty, price: `${l.totalUsd.toFixed(2)} USD` })),
      proformaUrl: `${process.env.PUBLIC_URL}/admin/pedidos/${order.id}/prefactura`,
      lang: "es",
    })).catch(() => null);
  }
  await rememberOrder(order.id);
  return Response.json({ orderId: order.id, paymentUrl });
});
