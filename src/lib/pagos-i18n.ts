import type { Idioma } from "./i18n-dict";

/**
 * Texto de fábrica de los métodos de pago, en español, con su traducción al
 * inglés. Las filas de `PaymentGateway` y `Order.paymentMethodName` guardan el
 * texto tal cual se sembró o se editó, así que se traduce al pintar y solo si
 * coincide exactamente: lo que el negocio haya reescrito se respeta.
 */
export const PAGO_EN: Record<string, string> = {
  // Nombres de los métodos de fábrica.
  Tropipay: "Tropipay",
  QvaPay: "QvaPay",
  "Transferencia bancaria": "Bank transfer",
  "Efectivo contra entrega": "Cash on delivery",
  "Pago manual": "Manual payment",
  "Enlace de pago": "Payment link",
  "USDT / cripto": "USDT / crypto",
  Zelle: "Zelle",

  // Descripciones sembradas en `payment-gateways.ts` y `pasarelas.ts`.
  "Tarjeta y saldo Tropipay. Confirmación automática.": "Tropipay card and balance. Automatic confirmation.",
  "Pago con saldo QvaPay. Confirmación automática.": "Payment with QvaPay balance. Automatic confirmation.",
  "Transferencia o depósito. Confirmamos el pago a mano.": "Bank transfer or deposit. We confirm payment manually.",
  "Pagas al recibir el pedido o al recogerlo en tienda.": "You pay when the order arrives or when you pick it up in store.",
  "Transferencia, depósito, Zelle, USDT o efectivo. Tú confirmas el pago.":
    "Bank transfer, deposit, Zelle, USDT or cash. You confirm the payment.",
  "Redirige a un enlace externo (PayPal, Stripe, etc.) y tú confirmas el pago.":
    "Redirects to an external link (PayPal, Stripe, etc.) and you confirm the payment.",

  // Descripciones de las plantillas del panel.
  "Datos bancarios y confirmación manual.": "Bank details and manual confirmation.",
  "Transferencia entre personas en Estados Unidos.": "Person-to-person transfer in the United States.",
  "Red o monedero que indiques en las instrucciones.": "Network or wallet you specify in the instructions.",
  "Solo para entregas que admitan pago contra entrega.": "Only for deliveries that accept cash on delivery.",
  "PayPal, Stripe u otra pasarela con enlace propio.": "PayPal, Stripe or another gateway with its own link.",
  "Cobro automático con Tropipay.": "Automatic charge with Tropipay.",
  "Cobro automático con QvaPay.": "Automatic charge with QvaPay.",

  // Instrucciones por defecto de la transferencia (BANK_INSTRUCTIONS).
  "Banco / cuenta / titular para transferencias": "Bank / account / account holder for transfers",

  // Etiquetas de campo que ve el comprador.
  Banco: "Bank",
  "Número de cuenta": "Account number",
  Titular: "Account holder",
  "Dato que debe poner el comprador": "Buyer reference",
  "Solo con pago contra entrega": "Cash on delivery only",
  "URL de pago": "Payment URL",
  "Texto del botón": "Button text",

  // Ayuda de esos campos (también se muestra en el panel).
  "Opcional: también puedes escribir los datos en las instrucciones.":
    "Optional: you can also write the details in the instructions.",
  "Por ejemplo, el número de pedido o el correo.": "For example, the order number or email.",
  "Si la entrega elegida no admite pago contra entrega, este método no se ofrece.":
    "If the chosen delivery doesn't accept cash on delivery, this method isn't offered.",
  "Enlace de PayPal, Stripe, Zelle u otra pasarela externa.":
    "Link to PayPal, Stripe, Zelle or another external gateway.",
  "Por defecto: «Ir a pagar».": "Default: “Go to payment”.",
  "Motivo del cobro que exige Tropipay (por defecto 4).": "Charge reason required by Tropipay (default 4).",

  // Texto por defecto del botón de los enlaces de pago.
  "Ir a pagar": "Go to payment",
};

/** Traduce el texto de fábrica; si no lo es (o el idioma es español), lo deja igual. */
export function pagoTexto(texto: string, lang: Idioma): string {
  if (lang !== "en" || !texto) return texto;
  return PAGO_EN[texto] ?? texto;
}
