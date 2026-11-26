"use client";

import { useEffect, useState } from "react";
import Icon from "@/components/brand/Icon";

export type BackToTopProps = {
  /** Distancia de scroll a partir de la cual aparece. */
  threshold?: number;
  label?: string;
  /** `false` lo deja en el flujo para colocarlo dentro de una barra lateral. */
  floating?: boolean;
  className?: string;
};

export default function BackToTop({
  threshold = 500,
  label = "Volver arriba",
  floating = true,
  className = "",
}: BackToTopProps) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setVisible((previous) => {
        const next = window.scrollY > threshold;
        return next === previous ? previous : next;
      });
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    update();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, [threshold]);

  const handleClick = () => {
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    window.scrollTo({ top: 0, behavior: reduce ? "auto" : "smooth" });
  };

  return (
    <button
      type="button"
      onClick={handleClick}
      aria-label={label}
      aria-hidden={!visible}
      tabIndex={visible ? 0 : -1}
      className={`grid place-items-center rounded-full border border-slate-200 bg-white/95 text-navy shadow-[0_12px_30px_-12px_rgba(2,27,72,0.55)] backdrop-blur transition-all duration-300 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-action)] ${
        floating
          ? "fixed bottom-5 right-4 z-40 h-11 w-11 print:hidden sm:right-6 sm:h-12 sm:w-12"
          : "h-10 w-10"
      } ${
        visible
          ? "pointer-events-auto translate-y-0 opacity-100"
          : "pointer-events-none translate-y-3 opacity-0"
      } ${className}`}
    >
      <Icon name="chevronRight" size={20} className="-rotate-90" />
    </button>
  );
}
