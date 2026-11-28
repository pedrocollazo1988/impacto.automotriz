import { z } from "zod";
import { prisma, asegurarEsquema } from "@/lib/prisma";
import { errorHttp, textoMensaje } from "@/lib/mensajes";
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
import { idiomaDeCookie, type Idioma } from "@/lib/i18n";
import { idiomaDe } from "@/lib/i18n-dict";
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
  // El idioma de esta visita manda también en los errores; si no hay cookie se usa
  // el que el cliente guardó en su cuenta.
  const idiomaVisita = await idiomaDeCookie();
  const idioma: Idioma = idiomaVisita ?? idiomaDe(me.preferredLanguage) ?? "es";
  await requireTurnstile(req, b.turnstileToken, idioma);
  await asegurarEsquema();
  // 1) Todo se recalcula en el servidor: precios, existencias, cupón y envío.
  const cart = await priceCart(b.items);
  if (!cart.allOk) throw await errorHttp(409, "carrito.noDisponible");
  const lineas = cart.lines.filter((l) => l.disponible);
  const coupon = await evaluateCoupon(b.coupon, cart.subtotalUsd, idioma);
  const { cashOnDelivery, ...delivery } = await buildOrderDelivery(b.delivery, r2(cart.subtotalUsd - coupon.discountUsd), idioma);
  const baseUsd = r2(cart.subtotalUsd - coupon.discountUsd + delivery.feeUsd);
  // El método lo define el panel: si está desactivado, archivado, fuera de rango
  // o sin lo obligatorio, no se acepta el pedido con ese método.
  const pasarelas = await leerPasarelas();
  const gw = pasarelas.find((p) => p.key === b.paymentMethod);
  if (!gw || !gw.enabled || gw.archived) throw await errorHttp(422, "pago.metodoNoDisponible");
  if (gw.minTotalUsd != null && baseUsd < gw.minTotalUsd) throw new HttpError(422, textoMensaje("msg.pago.minimo", idioma).replace("{min}", String(gw.minTotalUsd)));
  if (gw.maxTotalUsd != null && baseUsd > gw.maxTotalUsd) throw new HttpError(422, textoMensaje("msg.pago.maximo", idioma).replace("{max}", String(gw.maxTotalUsd)));
  if (!estaOperativa(gw, gw.creds)) throw await errorHttp(422, "pago.metodoSinConfigurar");
  if (requiereContraEntrega(gw) && !cashOnDelivery) throw await errorHttp(422, "entrega.sinContraEntrega");
  const feeUsd = comision(gw, baseUsd);
  const totalUsd = r2(baseUsd + feeUsd);

  // El pedido sale en el idioma de esta visita; al comprar se sincroniza esa preferencia.
  const lang: Idioma = idioma;
  if (idiomaVisita && idiomaVisita !== me.preferredLanguage) {
    await prisma.customer.update({ where: { id: me.id }, data: { preferredLanguage: idiomaVisita } }).catch(() => {});
  }
  // 2) Pedido + stock + cupón en una sola transacción (si algo falla, se revierte todo).
  const order = await prisma.$transaction(async (tx) => {
    // El pedido se crea primero para tener número y poder enlazar cada movimiento.
    const created = await tx.order.create({
      data: {
        paymentMethod: gw.key, paymentMethodName: gw.name, customerName: b.customer.name || me.name, customerEmail: me.email ?? "", customerPhone: b.customer.phone || me.phone || "", customerId: me.id, lang,
        subtotalUsd: cart.subtotalUsd, discountUsd: coupon.discountUsd, couponCode: coupon.code, shippingUsd: delivery.feeUsd, paymentFeeUsd: feeUsd, totalUsd,
        items: { create: lineas.map((l) => ({ productId: l.productId, variantId: l.variantId, name: l.name, unitUsd: l.unitUsd, qty: l.qty })) },
        delivery: { create: delivery },
      },
    });
    for (const l of lineas) {
      if (l.variantId) { // el stock del producto es la suma de sus variantes: se descuentan ambos
        const rv = await tx.productVariant.updateMany({ where: { id: l.variantId, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
        if (rv.count === 0) throw new HttpError(409, textoMensaje("msg.checkout.sinExistencias", idioma).replace("{producto}", l.name));
      }
      const r = await tx.product.updateMany({ where: { id: l.productId, stock: { gte: l.qty } }, data: { stock: { decrement: l.qty } } });
      if (r.count === 0) throw new HttpError(409, textoMensaje("msg.checkout.sinExistencias", idioma).replace("{producto}", l.name));
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
      if (r.count === 0) throw await errorHttp(422, "cupon.agotado");
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
  if (me.email) await sendTransactional(me.email, emailT(lang, "order.subject", { number: order.number }), orderConfirmationEmail({
    name: b.customer.name || me.name,
    orderNumber: order.number,
    total: `${totalUsd.toFixed(2)} USD`,
    items: lineas.map((l) => ({ name: l.name, qty: l.qty, price: `${l.totalUsd.toFixed(2)} USD` })),
    trackingUrl: `${process.env.PUBLIC_URL}/pedido/${order.id}?t=${orderToken(order.id)}`,
    deliveryPin: delivery.confirmationCode,
    lang,
  }));
  const adminEmail = process.env.ADMIN_EMAIL?.trim();
  if (adminEmail) {
    await sendTransactional(adminEmail, emailT("es", "adminOrder.subject", { number: order.number }), adminOrderEmail({
      orderNumber: order.number,
      customerName: b.customer.name || me.name,
      customerEmail: me.email ?? "",
      total: `${totalUsd.toFixed(2)} USD`,
      items: lineas.map((l) => ({ name: l.name, qty: l.qty, price: `${l.totalUsd.toFixed(2)} USD` })),
      proformaUrl: `${process.env.PUBLIC_URL}/admin/pedidos/${order.id}/prefactura`,
      lang: "es",
    })).catch(() => null);
  }
  await rememberOrder(order.id);
  return Response.json({ orderId: order.id, paymentUrl });
});
