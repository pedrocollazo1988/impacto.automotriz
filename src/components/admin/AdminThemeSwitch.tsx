"use client";

import { useEffect } from "react";
import Icon from "@/components/brand/Icon";
import { usePreferences, type Tema } from "@/components/site/Preferences";

const OPCIONES: { valor: Tema; clave: string; icono: string }[] = [
  { valor: "light", clave: "theme.light", icono: "sun" },
  { valor: "dark", clave: "theme.dark", icono: "moon" },
  { valor: "system", clave: "theme.system", icono: "monitor" },
];

/** Claro · Oscuro · Automático. La preferencia vive en la cuenta del usuario del
 *  equipo (y en el navegador como respaldo), así que viaja entre dispositivos. */
export default function AdminThemeSwitch() {
  const { theme, setTheme, t } = usePreferences();

  useEffect(() => {
    let vivo = true;
    fetch("/api/admin/preferencias", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        const guardado = d?.theme;
        // Solo manda la cuenta si hay valor; si no, se respeta lo del navegador.
        if (vivo && (guardado === "light" || guardado === "dark" || guardado === "system")) setTheme(guardado);
      })
      .catch(() => {});
    return () => { vivo = false; };
  }, [setTheme]);

  const elegir = (valor: Tema) => {
    setTheme(valor);
    fetch("/api/admin/preferencias", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ theme: valor }) }).catch(() => {});
  };

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
            onClick={() => elegir(o.valor)}
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
