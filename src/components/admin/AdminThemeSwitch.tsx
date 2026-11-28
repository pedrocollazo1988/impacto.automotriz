"use client";

import Icon from "@/components/brand/Icon";
import { usePreferences, type Tema } from "@/components/site/Preferences";

const OPCIONES: { valor: Tema; clave: string; icono: string }[] = [
  { valor: "light", clave: "theme.light", icono: "sun" },
  { valor: "dark", clave: "theme.dark", icono: "moon" },
  { valor: "system", clave: "theme.system", icono: "monitor" },
];

/** Claro · Oscuro · Automático. La preferencia se guarda en el navegador y el
 *  script de arranque del layout la aplica antes de pintar (sin parpadeo). */
export default function AdminThemeSwitch() {
  const { theme, setTheme, t } = usePreferences();
  return (
    <div role="radiogroup" aria-label={t("theme.change")} className="hidden items-center gap-0.5 rounded-xl border border-slate-200 bg-slate-50 p-0.5 sm:flex">
      {OPCIONES.map((o) => {
        const activo = theme === o.valor;
        return (
          <button
            key={o.valor}
            type="button"
            role="radio"
            aria-checked={activo}
            title={t(o.clave)}
            onClick={() => setTheme(o.valor)}
            className={`flex h-8 items-center gap-1.5 rounded-lg px-2 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] ${
              activo
                ? "bg-white text-[color:var(--color-accent-hover)] shadow-sm ring-1 ring-[color:var(--color-accent)]/30"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Icon name={o.icono} size={15} />
            <span className="hidden md:inline">{t(o.clave)}</span>
          </button>
        );
      })}
    </div>
  );
}
