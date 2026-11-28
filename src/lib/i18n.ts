import { cookies } from "next/headers";
import { traducir, idiomaDe, type Idioma } from "./i18n-dict";

export type { Idioma };

/** Idioma que el visitante eligió en este navegador. Sin cookie no hay idioma. */
export async function idiomaDeCookie(): Promise<Idioma | null> {
  const cookie = await cookies();
  return idiomaDe(cookie.get("lang")?.value);
}

/** Idioma guardado por LanguageToggle. Sin cookie se sirve español. */
export async function getLang(): Promise<Idioma> {
  return (await idiomaDeCookie()) ?? "es";
}

/**
 * Idioma del destinatario de un correo o SMS. Manda la preferencia guardada en
 * su ficha (Customer.preferredLanguage, Subscriber.lang, Order.lang); si no hay
 * o no es válida se usa el idioma de la petición y, como último recurso, español.
 */
export async function idiomaDeCliente(preferido?: string | null): Promise<Idioma> {
  return idiomaDe(preferido) ?? (await idiomaDeCookie()) ?? "es";
}

export async function getT(): Promise<{ lang: Idioma; t: (key: string) => string }> {
  const lang = await getLang();
  return { lang, t: (key) => traducir(lang, key) };
}
