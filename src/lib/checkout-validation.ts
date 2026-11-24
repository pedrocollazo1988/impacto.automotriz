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

export function validarCheckout(d: CheckoutDraft): CheckoutErrors {
  const errores: CheckoutErrors = {};
  if (!d.cartOk) errores.cart = "Ajusta el carrito: hay productos por encima del stock disponible.";
  if (d.name.trim().length < 2) errores.name = "Escribe tu nombre completo.";
  if (!CORREO.test(d.email.trim())) errores.email = "Escribe un correo válido, por ejemplo nombre@correo.com.";
  if (d.phone.trim().length < 6) errores.phone = "Escribe un teléfono con al menos 6 dígitos.";
  if (!d.hasDelivery) errores.delivery = "Completa la entrega: provincia, municipio, método y datos de quien recibe.";
  if (!d.hasPayment) errores.payment = "Elige un método de pago.";
  return errores;
}

export function textoEnvio(hasDelivery: boolean, feeUsd: number, lang: "es" | "en" = "es"): string {
  if (!hasDelivery) return lang === "en" ? "To calculate" : "Por calcular";
  return feeUsd === 0 ? (lang === "en" ? "Free" : "Gratis") : `${feeUsd.toFixed(2)} USD`;
}
