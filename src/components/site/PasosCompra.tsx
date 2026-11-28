"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

const CLAVES_PASOS: [string, string, string][] = [
  ["search", "steps.1.title", "steps.1.text"],
  ["check", "steps.2.title", "steps.2.text"],
  ["card", "steps.3.title", "steps.3.text"],
  ["truck", "steps.4.title", "steps.4.text"],
];

export default function PasosCompra({ eyebrow, title, pasos }: { eyebrow?: string; title?: string; pasos?: [string, string, string][] }) {
  const { t } = usePreferences();
  const eyebrowTexto = eyebrow ?? t("steps.eyebrow");
  const titulo = title ?? t("steps.title");
  const lista = pasos ?? CLAVES_PASOS.map(([ic, claveTitulo, claveTexto]) => [ic, t(claveTitulo), t(claveTexto)] as [string, string, string]);
  const linea = useRef<SVGPathElement>(null);

  useEffect(() => {
    const el = linea.current;
    if (!el) return;
    // Con movimiento reducido o sin soporte, la linea se muestra ya dibujada.
    if (typeof IntersectionObserver === "undefined" || window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      el.dataset.visible = "true";
      return;
    }

    const io = new IntersectionObserver(
      ([entry]) => {
        if (!entry.isIntersecting) return;
        el.dataset.visible = "true";
        io.disconnect();
      },
      { rootMargin: "0px 0px -15% 0px" },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <section className="container-x mt-16">
      <div className="card relative overflow-hidden p-6 sm:p-8">
        <div aria-hidden className="absolute inset-0 blueprint-dark" />
        <div className="relative">
          <span className="eyebrow">{eyebrowTexto}</span>
          <h2 className="sec-title mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">{titulo}</h2>

          <div className="relative mt-8">
            {/* Línea de progreso: se dibuja al entrar en pantalla y conecta
                visualmente las cuatro tarjetas en escritorio. */}
            <svg
              aria-hidden
              className="pointer-events-none absolute left-[12.5%] right-[12.5%] top-[2.15rem] hidden h-2 lg:block"
              viewBox="0 0 100 2"
              preserveAspectRatio="none"
            >
              <path
                ref={linea}
                className="paso-linea"
                d="M0 1 H100"
                stroke="url(#paso-gradiente)"
                strokeWidth="2"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
              <defs>
                <linearGradient id="paso-gradiente" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="var(--color-action)" stopOpacity="0.15" />
                  <stop offset="50%" stopColor="var(--color-action)" stopOpacity="0.75" />
                  <stop offset="100%" stopColor="var(--color-action)" stopOpacity="0.15" />
                </linearGradient>
              </defs>
            </svg>

            <ol className="relative grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
              {lista.map(([ic, tituloPaso, texto], i) => (
                <li key={tituloPaso} className="group relative">
                  <div className="flex h-full flex-col rounded-2xl border border-slate-200/80 bg-white/90 p-4 shadow-[0_10px_28px_-22px_rgba(2,27,72,0.55)] transition duration-300 group-hover:-translate-y-0.5 group-hover:border-[color:var(--color-action)]/35 group-hover:shadow-[0_18px_36px_-20px_rgba(2,27,72,0.55)]">
                    <div className="flex items-center gap-2.5">
                      <span className="paso-num" aria-hidden>{i + 1}</span>
                      <span className="grid h-9 w-9 place-items-center rounded-xl bg-[color:var(--color-action)]/10 text-[color:var(--color-action)]">
                        <Icon name={ic} size={17} />
                      </span>
                    </div>
                    <h3 className="mt-3 font-display text-sm font-bold text-navy">{tituloPaso}</h3>
                    <p className="mt-1 text-xs leading-relaxed text-slate-600">{texto}</p>
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </div>
      </div>
    </section>
  );
}
