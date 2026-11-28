"use client";

import { useEffect, useRef, useState } from "react";
import { usePreferences } from "@/components/site/Preferences";

/**
 * Dos caminos para entrar con Telegram:
 *  - el widget oficial (cómodo en escritorio);
 *  - un enlace al bot con nonce, que es el que funciona bien en el móvil: el
 *    bot confirma el enlace y esta página lo detecta preguntando cada pocos
 *    segundos.
 */
export default function TelegramLogin({ usuario }: { usuario: string }) {
  const { t, lang } = usePreferences();
  const caja = useRef<HTMLDivElement>(null);
  const vivo = useRef(true);
  const [fase, setFase] = useState<"inicio" | "esperando" | "listo" | "error">("inicio");

  useEffect(() => {
    vivo.current = true;
    return () => { vivo.current = false; };
  }, []);

  useEffect(() => {
    const contenedor = caja.current;
    if (!contenedor) return;
    const script = document.createElement("script");
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.async = true;
    script.setAttribute("data-telegram-login", usuario);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-radius", "12");
    script.setAttribute("data-userpic", "false");
    script.setAttribute("data-lang", lang);
    script.setAttribute("data-auth-url", `${window.location.origin}/api/account/telegram/callback`);
    contenedor.appendChild(script);
    return () => { contenedor.replaceChildren(); };
  }, [usuario, lang]);

  async function porEnlace() {
    setFase("esperando");
    const ventana = window.open("about:blank", "_blank");
    const r = await fetch("/api/account/telegram/enlace", { method: "POST" });
    const d = await r.json().catch(() => null);
    if (!d?.ok) {
      ventana?.close();
      setFase("error");
      return;
    }
    if (ventana) ventana.location.href = d.url;
    else window.location.href = d.url;

    const limite = Date.now() + 5 * 60_000;
    while (vivo.current && Date.now() < limite) {
      await new Promise((res) => setTimeout(res, 2500));
      if (!vivo.current) return;
      const s = await fetch(`/api/account/telegram/estado?nonce=${encodeURIComponent(d.nonce)}`)
        .then((x) => x.json())
        .catch(() => null);
      if (s?.estado === "listo") {
        setFase("listo");
        window.location.href = s.redirect ?? "/cuenta";
        return;
      }
      if (s?.estado === "caducado" || s?.estado === "ocupado") { setFase("error"); return; }
    }
    if (vivo.current) setFase("error");
  }

  return (
    <div className="flex flex-col items-center gap-2">
      <div ref={caja} className="flex justify-center" />
      <button type="button" onClick={porEnlace} disabled={fase === "esperando" || fase === "listo"} className="text-xs font-semibold text-slate-500 hover:text-navy disabled:opacity-60">
        {t("tg.mobileLink")}
      </button>
      {fase === "esperando" && <p role="status" className="text-xs text-slate-500">{t("tg.waiting")}</p>}
      {fase === "listo" && <p role="status" className="text-xs text-[color:var(--color-ok)]">{t("tg.done")}</p>}
      {fase === "error" && <p role="alert" className="text-xs text-red-600">{t("tg.error")}</p>}
    </div>
  );
}
