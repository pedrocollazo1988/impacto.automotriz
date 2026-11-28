import { cookies } from "next/headers";
import { HttpError } from "@/lib/auth";

/** Mensajes del servidor que ve el cliente. Cada clave tiene español e inglés:
 *  el idioma sale de la cookie `lang` que fija el selector de idioma. */
const MENSAJES = {
  "err.sesion": ["Inicia sesión", "Please sign in"],
  "err.datos": ["Datos inválidos", "Invalid data"],
  "err.interno": ["Error interno", "Something went wrong"],
  "err.demasiadosIntentos": ["Demasiados intentos. Espera unos minutos.", "Too many attempts. Please wait a few minutes."],
  "mensaje.envioFallido": ["No pudimos enviar el código. Revisa la configuración de correo e inténtalo de nuevo.", "We couldn't send the code. Check the email settings and try again."],
  "auth.enlaceInvalido": ["Enlace inválido o vencido", "Invalid or expired link"],
  "codigo.invalido": ["El código de seguridad no es válido o venció. Pide otro e inténtalo de nuevo.", "The security code is invalid or expired. Request a new one and try again."],
  "codigo.usado": ["Ese código de seguridad ya se usó. Pide otro e inténtalo de nuevo.", "That security code was already used. Request a new one and try again."],
  "pin.incorrecto": ["Código incorrecto o vencido. Pide uno nuevo.", "Incorrect or expired code. Request a new one."],
  "garaje.maximo": ["Máximo 10 vehículos guardados", "Up to 10 saved vehicles"],
  "pago.noDisponible": ["Este pedido no admite pago en línea", "This order can't be paid online"],
  "pago.metodoNoDisponible": ["Ese método de pago no está disponible", "That payment method isn't available"],
  "pago.metodoSinConfigurar": ["Ese método de pago no está configurado todavía", "That payment method isn't configured yet"],
  "entrega.sinContraEntrega": ["Este método de entrega no admite pago contra entrega", "This delivery method doesn't allow cash on delivery"],
  "cupon.agotado": ["Cupón agotado", "Coupon used up"],
  "cuenta.yaExiste": ["Ya existe una cuenta con ese correo", "An account with that email already exists"],
  "valorar.soloComprados": ["Solo puedes valorar productos que compraste", "You can only review products you bought"],
  "carrito.noDisponible": ["Algún producto ya no está disponible en la cantidad pedida", "An item is no longer available in the requested quantity"],
  "msg.envio.noDisponible": ["No disponible en este municipio", "Not available in this municipality"],
  "msg.envio.pedidoMinimo": ["Pedido mínimo: {min} USD", "Minimum order: {min} USD"],
  "msg.envio.metodoNoDisponible": ["Método de entrega no disponible", "Delivery method not available"],
  "msg.envio.faltaDireccion": ["Falta la dirección de entrega", "Delivery address is required"],
  "msg.envio.eligePunto": ["Elige un punto de recogida", "Choose a pickup point"],
  "msg.envio.franjaInvalida": ["Franja horaria inválida", "Invalid time slot"],
  "msg.envio.franjaCompleta": ["Esa franja ya está completa", "That time slot is already full"],
  "msg.cupon.invalido": ["Cupón no válido", "Invalid coupon"],
  "msg.cupon.minimo": ["Este cupón exige un pedido mínimo de {min} USD", "This coupon requires a minimum order of {min} USD"],
  "msg.captcha.requerido": ["Completa la verificación anti-bots.", "Please complete the anti-bot check."],
  "msg.captcha.fallo": ["La verificación anti-bots falló. Recárgala e inténtalo de nuevo.", "The anti-bot check failed. Reload it and try again."],
  "msg.captcha.noDisponible": ["El captcha no está disponible: falta configurar APP_SECRET en el servidor.", "The captcha isn't available: APP_SECRET isn't configured on the server."],
  "msg.pago.minimo": ["Ese método requiere un mínimo de {min} USD", "That method requires a minimum of {min} USD"],
  "msg.pago.maximo": ["Ese método admite hasta {max} USD", "That method allows up to {max} USD"],
  "msg.checkout.sinExistencias": ["Sin existencias suficientes: {producto}", "Not enough stock: {producto}"],
  "msg.rastreo.datos": ["Escribe el número de pedido o el PIN de entrega, y el contacto con el que compraste.", "Enter the order number or delivery PIN, and the contact you used to buy."],
  "msg.rastreo.noEncontrado": ["No encontramos un pedido con esos datos. Revisa el número o PIN y el contacto.", "We couldn't find an order with that data. Check the number or PIN and the contact."],
  "msg.registro.emailError": ["No se pudo enviar el código. Revisa la configuración de correo o pide un reenvío.", "We couldn't send the code. Check the email settings or request a new one."],
  "msg.email.confirmada": ["¡Suscripción confirmada!", "Subscription confirmed!"],
  "msg.email.enlaceInvalido": ["Enlace no válido", "Invalid link"],
  "msg.email.baja": ["Te diste de baja correctamente", "You've been unsubscribed successfully"],
  "msg.telegram.enlaceCaducado": ["Ese enlace ya no sirve. Vuelve a la web de Impacto Automotriz y pide uno nuevo.", "That link is no longer valid. Go back to the Impacto Automotriz website and request a new one."],
  "msg.telegram.listo": ["Listo. Vuelve a la web de Impacto Automotriz: ya estás dentro.", "Done. Go back to the Impacto Automotriz website: you're signed in."],
} as const satisfies Record<string, readonly [string, string]>;

export const CLAVES_MENSAJE = Object.keys(MENSAJES) as (keyof typeof MENSAJES)[];

export type ClaveMensaje = keyof typeof MENSAJES;
export type IdiomaMensaje = "es" | "en";

export function idiomaDeCookie(valor: string | undefined): IdiomaMensaje {
  return valor === "en" ? "en" : "es";
}

export function textoMensaje(clave: ClaveMensaje, idioma: IdiomaMensaje = "es"): string {
  const [es, en] = MENSAJES[clave];
  return idioma === "en" ? en : es;
}

/** Texto ya traducido al idioma del visitante. */
export async function mensaje(clave: ClaveMensaje): Promise<string> {
  const valor = (await cookies()).get("lang")?.value;
  return textoMensaje(clave, idiomaDeCookie(valor));
}

/** Atajo para las rutas: un 4xx/5xx con el mensaje en el idioma del visitante. */
export async function errorHttp(status: number, clave: ClaveMensaje): Promise<HttpError> {
  return new HttpError(status, await mensaje(clave));
}
