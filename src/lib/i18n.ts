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

export async function getT(): Promise<{ lang: Idioma; t: (key: string) => string }> {
  const lang = await getLang();
  return { lang, t: (key) => traducir(lang, key) };
}
