import { cookies } from "next/headers";
import { traducir, type Idioma } from "./i18n-dict";

export type { Idioma };

/** Idioma guardado por LanguageToggle. Sin cookie se sirve español. */
export async function getLang(): Promise<Idioma> {
  const cookie = await cookies();
  return cookie.get("lang")?.value === "en" ? "en" : "es";
}

export async function getT(): Promise<{ lang: Idioma; t: (key: string) => string }> {
  const lang = await getLang();
  return { lang, t: (key) => traducir(lang, key) };
}
