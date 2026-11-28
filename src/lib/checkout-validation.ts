export type CheckoutDraft = {
  name: string;
  email: string;
  phone: string;
  cartOk: boolean;
  hasDelivery: boolean;
  hasPayment: boolean;
};

export type CheckoutErrors = Partial<Record<"cart" | "name" | "email" | "phone" | "delivery" | "payment", string>>;

const CORREO = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

// Devuelve claves de traducción: la vista las resuelve con t().
export function validarCheckout(d: CheckoutDraft): CheckoutErrors {
  const errores: CheckoutErrors = {};
  if (!d.cartOk) errores.cart = "checkout2.errCart";
  if (d.name.trim().length < 2) errores.name = "checkout2.errName";
  if (!CORREO.test(d.email.trim())) errores.email = "checkout2.errEmail";
  if (d.phone.trim().length < 6) errores.phone = "checkout2.errPhone";
  if (!d.hasDelivery) errores.delivery = "checkout2.errDelivery";
  if (!d.hasPayment) errores.payment = "checkout2.errPayment";
  return errores;
}

export function textoEnvio(hasDelivery: boolean, feeUsd: number, lang: "es" | "en" = "es"): string {
  if (!hasDelivery) return lang === "en" ? "To calculate" : "Por calcular";
  return feeUsd === 0 ? (lang === "en" ? "Free" : "Gratis") : `${feeUsd.toFixed(2)} USD`;
}
