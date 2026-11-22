"use client";

import { useEffect, useRef } from "react";
import Icon from "@/components/brand/Icon";

const PASOS: [string, string, string][] = [
  ["search", "Busca tu pieza", "Por el catálogo completo o filtrando por marca, modelo y año de tu vehículo."],
  ["check", "Confirma la compatibilidad", "Cada ficha indica para qué vehículos sirve. Si dudas, te lo revisamos por WhatsApp."],
  ["card", "Paga en línea", "Tropipay, QvaPay, transferencia o efectivo al recibir. Recibes tu comprobante al instante."],
  ["truck", "Recíbela en tu provincia", "Domicilio, mensajería o recogida en tienda, con la tarifa de tu municipio."],
];

export default function PasosCompra() {
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
          <span className="eyebrow">Sin sorpresas</span>
          <h2 className="sec-title mt-1 font-display text-2xl font-extrabold text-navy sm:text-3xl">Así compras tu pieza</h2>

          <div className="relative mt-8">
            {/* Línea que se dibuja al entrar en pantalla (solo escritorio). */}
            <svg
              aria-hidden
              className="pointer-events-none absolute left-0 right-0 top-[1.3rem] hidden h-2 w-full lg:block"
              viewBox="0 0 100 2"
              preserveAspectRatio="none"
            >
              <path
                ref={linea}
                className="paso-linea"
                d="M0 1 H100"
                stroke="color-mix(in oklab, var(--color-action) 45%, transparent)"
                strokeWidth="2"
                fill="none"
                vectorEffect="non-scaling-stroke"
              />
            </svg>

            <ol className="relative grid gap-6 sm:grid-cols-2 lg:grid-cols-4">
              {PASOS.map(([ic, titulo, texto], i) => (
                <li key={titulo} className="flex gap-3">
                  <span className="paso-num" aria-hidden>{i + 1}</span>
                  <div className="min-w-0">
                    <h3 className="flex items-center gap-1.5 font-display text-sm font-bold text-navy">
                      <Icon name={ic} size={15} /> {titulo}
                    </h3>
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
