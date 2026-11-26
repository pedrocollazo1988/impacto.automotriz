"use client";

import { useEffect, useState } from "react";

export type HeroRotatorProps = {
  images: string[];
  intervalMs?: number;
};

/**
 * Fondo rotatorio para un contenedor posicionado (`relative`). Es absoluto y
 * no participa del flujo, así que no altera la altura del hero. Sin controles:
 * es decorativo y queda oculto para lectores de pantalla.
 */
export default function HeroRotator({
  images,
  intervalMs = 5000,
}: HeroRotatorProps) {
  const [active, setActive] = useState(0);
  const [reduceMotion, setReduceMotion] = useState(false);

  useEffect(() => {
    const query = window.matchMedia("(prefers-reduced-motion: reduce)");
    const sync = () => setReduceMotion(query.matches);
    sync();
    query.addEventListener("change", sync);
    return () => query.removeEventListener("change", sync);
  }, []);

  useEffect(() => {
    if (reduceMotion || images.length < 2) {
      setActive(0);
      return;
    }

    const id = window.setInterval(() => {
      setActive((current) => (current + 1) % images.length);
    }, intervalMs);

    return () => window.clearInterval(id);
  }, [images.length, intervalMs, reduceMotion]);

  if (images.length === 0) return null;

  const current = active % images.length;

  return (
    <div
      aria-hidden="true"
      className="pointer-events-none absolute inset-0 overflow-hidden"
    >
      {images.map((src, index) => (
        <img
          key={`${src}-${index}`}
          src={src}
          alt=""
          draggable={false}
          loading={index === 0 ? "eager" : "lazy"}
          decoding="async"
          fetchPriority={index === 0 ? "high" : "auto"}
          className={`absolute inset-0 h-full w-full select-none object-cover transition-opacity duration-1000 ease-in-out ${
            index === current ? "opacity-100" : "opacity-0"
          }`}
        />
      ))}
    </div>
  );
}
