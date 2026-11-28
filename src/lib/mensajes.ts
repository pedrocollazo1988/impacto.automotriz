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
