"use client";
import { useEffect, useRef } from "react";

type TurnstileApi = {
  render: (el: HTMLElement, opts: Record<string, unknown>) => string;
  remove: (id: string) => void;
  reset: (id?: string) => void;
};
declare global {
  interface Window { turnstile?: TurnstileApi }
}

let carga: Promise<void> | null = null;
function cargarScript() {
  if (window.turnstile) return Promise.resolve();
  if (carga) return carga;
  carga = new Promise<void>((resolve, reject) => {
    const s = document.createElement("script");
    s.src = "https://challenges.cloudflare.com/turnstile/v0/api.js?render=explicit";
    s.async = true;
    s.defer = true;
    s.onload = () => resolve();
    s.onerror = () => { carga = null; reject(new Error("No se pudo cargar Turnstile")); };
    document.head.appendChild(s);
  });
  return carga;
}

/** Widget de Cloudflare Turnstile. Sin site key no pinta nada y el servidor omite la comprobación. */
export default function Turnstile({ onToken, className = "" }: { onToken: (token: string) => void; className?: string }) {
  const contenedor = useRef<HTMLDivElement>(null);
  const callback = useRef(onToken);
  callback.current = onToken;
  const siteKey = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

  useEffect(() => {
    if (!siteKey) return;
    let cancelado = false;
    let id: string | null = null;
    cargarScript()
      .then(() => {
        if (cancelado || !contenedor.current || !window.turnstile) return;
        id = window.turnstile.render(contenedor.current, {
          sitekey: siteKey,
          theme: document.documentElement.dataset.theme === "dark" ? "dark" : "light",
          language: "es",
          callback: (token: string) => callback.current(token),
          "expired-callback": () => callback.current(""),
          "error-callback": () => callback.current(""),
        });
      })
      .catch(() => callback.current(""));
    return () => {
      cancelado = true;
      if (id && window.turnstile) window.turnstile.remove(id);
    };
  }, [siteKey]);

  if (!siteKey) return null;
  return <div ref={contenedor} className={`min-h-[65px] ${className}`} aria-label="Verificación anti-bots" />;
}
