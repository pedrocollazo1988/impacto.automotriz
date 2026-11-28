"use client";
import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";
import { DICCIONARIO, type Idioma } from "@/lib/i18n-dict";

export type Tema = "light" | "dark" | "system";
export type { Idioma };

type Ctx = {
  theme: Tema; setTheme: (t: Tema) => void;
  lang: Idioma; setLang: (l: Idioma) => void;
  t: (key: string) => string;
};
const C = createContext<Ctx | null>(null);
export const usePreferences = () => {
  const c = useContext(C);
  if (!c) throw new Error("PreferencesProvider ausente");
  return c;
};

const aplicarTema = (t: Tema) => {
  const oscuro = t === "dark" || (t === "system" && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.classList.toggle("dark", oscuro);
  document.documentElement.dataset.theme = oscuro ? "dark" : "light";
  document.documentElement.style.colorScheme = oscuro ? "dark" : "light";
};

export function PreferencesProvider({ children }: { children: ReactNode }) {
  const router = useRouter();
  const [theme, setThemeState] = useState<Tema>("system");
  const [lang, setLangState] = useState<Idioma>("es");
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const t = localStorage.getItem("theme");
    const l = localStorage.getItem("lang");
    if (t === "light" || t === "dark" || t === "system") setThemeState(t);
    if (l === "es" || l === "en") setLangState(l);
    setReady(true);
  }, []);

  useEffect(() => {
    if (!ready) return;
    aplicarTema(theme);
    localStorage.setItem("theme", theme);
    const mq = window.matchMedia("(prefers-color-scheme: dark)");
    const alCambiar = () => { if (theme === "system") aplicarTema("system"); };
    mq.addEventListener("change", alCambiar);
    return () => mq.removeEventListener("change", alCambiar);
  }, [theme, ready]);

  useEffect(() => {
    if (!ready) return;
    document.documentElement.lang = lang;
    localStorage.setItem("lang", lang);
    const cookieLang = document.cookie.match(/(?:^|; )lang=(es|en)(?:;|$)/)?.[1];
    if (cookieLang !== lang) {
      document.cookie = `lang=${lang};path=/;max-age=31536000;samesite=lax`;
      router.refresh();
    }
  }, [lang, ready, router]);

  // Estable: los efectos que dependen de él no deben repetirse en cada render.
  const setTheme = useCallback((t: Tema) => setThemeState(t), []);
  const setLang = (l: Idioma) => {
    setLangState(l);
    document.cookie = `lang=${l};path=/;max-age=31536000;samesite=lax`;
    router.refresh();
  };
  const t = (key: string) => DICCIONARIO[lang][key] ?? DICCIONARIO.es[key] ?? key;
  return <C.Provider value={{ theme, setTheme, lang, setLang, t }}>{children}</C.Provider>;
}

const ORDEN: Tema[] = ["light", "dark", "system"];
export function ThemeToggle({ compact = false }: { compact?: boolean }) {
  const { theme, setTheme, t } = usePreferences();
  const icono = theme === "dark" ? "moon" : theme === "light" ? "sun" : "monitor";
  const actual = t(`theme.${theme}`);
  return (
    <button
      type="button"
      onClick={() => setTheme(ORDEN[(ORDEN.indexOf(theme) + 1) % ORDEN.length])}
      className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition hover:bg-white/10"
      title={`${t("theme.change")}: ${actual}`}
      aria-label={`${t("theme.change")}: ${actual}`}
    >
      <Icon name={icono} size={14} />
      {!compact && <span>{actual}</span>}
    </button>
  );
}

export function LanguageToggle({ compact = false }: { compact?: boolean }) {
  const { lang, setLang, t } = usePreferences();
  return (
    <button
      type="button"
      onClick={() => setLang(lang === "es" ? "en" : "es")}
      className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition hover:bg-white/10"
      title={t("lang.change")}
      aria-label={`${t("lang.change")} (${lang.toUpperCase()})`}
    >
      <Icon name="globe" size={14} />
      {!compact && <span>{lang.toUpperCase()}</span>}
    </button>
  );
}
