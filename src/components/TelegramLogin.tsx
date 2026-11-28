"use client";

import { useEffect, useRef } from "react";

/**
 * Botón oficial de Telegram (widget de acceso). Se inyecta a mano porque el
 * script no se puede cargar con next/script sin perder los atributos data-*.
 * Sin dominio configurado en @BotFather el widget no dibuja nada.
 */
export default function TelegramLogin({ usuario }: { usuario: string }) {
  const caja = useRef<HTMLDivElement>(null);

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
    script.setAttribute("data-auth-url", `${window.location.origin}/api/account/telegram/callback`);
    contenedor.appendChild(script);
    return () => { contenedor.replaceChildren(); };
  }, [usuario]);

  return <div ref={caja} className="flex justify-center" />;
}
