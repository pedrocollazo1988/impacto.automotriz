"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Aparición al entrar en pantalla. El atributo data-reveal lo pone el JS, así
 * que si el JS no carga (o el navegador no soporta IntersectionObserver) el
 * contenido se ve desde el principio en vez de quedarse invisible.
 */
export default function Reveal({
  children,
  className = "",
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") return;
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    el.dataset.reveal = "";
    el.style.transitionDelay = delay ? `${delay}ms` : "";

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.visible = "true";
        io.disconnect();
      },
      { rootMargin: "0px 0px -10% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, [delay]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}
