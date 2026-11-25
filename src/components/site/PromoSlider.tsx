"use client";
/* eslint-disable @next/next/no-img-element */
import { useCallback, useEffect, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

export type Slide = {
  imagen: string;
  titulo: string;
  texto?: string;
  href: string;
  icono?: string;
};

export default function PromoSlider({ items }: { items: Slide[] }) {
  const { t } = usePreferences();
  const [i, setI] = useState(0);
  const [pausa, setPausa] = useState(false);
  const touch = useRef<number | null>(null);
  const n = items.length;
  const mover = useCallback((delta: number) => setI((v) => (v + delta + n) % n), [n]);

  useEffect(() => {
    if (n < 2 || pausa) return;
    const t = window.setInterval(() => setI((v) => (v + 1) % n), 6500);
    return () => window.clearInterval(t);
  }, [n, pausa]);

  if (!n) return null;
  const activo = items[Math.min(i, n - 1)];

  return (
    <section
      className="container-x mt-5"
      aria-roledescription="carrusel"
      aria-label={t("home.promosTitle")}
      onMouseEnter={() => setPausa(true)}
      onMouseLeave={() => setPausa(false)}
      onFocus={() => setPausa(true)}
      onBlur={() => setPausa(false)}
    >
      <div
        className="relative overflow-hidden rounded-[1.5rem] bg-[color:var(--color-navy-deep)] shadow-[0_22px_60px_-30px_rgb(2_27_72/0.65)]"
        onTouchStart={(e) => { touch.current = e.touches[0]?.clientX ?? null; }}
        onTouchEnd={(e) => {
          if (touch.current == null) return;
          const dx = (e.changedTouches[0]?.clientX ?? 0) - touch.current;
          if (Math.abs(dx) > 45) mover(dx < 0 ? 1 : -1);
          touch.current = null;
        }}
      >
        <div className="relative h-[250px] min-[360px]:h-[230px] sm:h-[280px] lg:h-[310px]">
          {items.map((s, idx) => (
            <div
              key={`${s.href}-${idx}`}
              className={`absolute inset-0 transition-opacity duration-700 ${idx === i ? "opacity-100" : "pointer-events-none opacity-0"}`}
              aria-hidden={idx !== i}
            >
              <img
                src={s.imagen}
                alt=""
                className="h-full w-full object-cover object-center"
                loading={idx === 0 ? "eager" : "lazy"}
                decoding="async"
              />
              <div className="absolute inset-0 bg-gradient-to-r from-[#021b48]/95 via-[#021b48]/72 to-transparent" />
              <div className="absolute inset-0 bg-gradient-to-t from-[#021b48]/55 via-transparent to-transparent" />
            </div>
          ))}

          <div className="relative z-10 flex h-full max-w-2xl flex-col justify-center px-5 py-7 text-white sm:px-9 lg:px-12">
            <span className="eyebrow eyebrow-light inline-flex w-fit items-center gap-2">
              <Icon name={activo.icono || "tag"} size={14} /> {t("home.promoEyebrow")}
            </span>
            <h2 className="mt-3 line-clamp-3 font-display text-[22px] font-extrabold leading-tight min-[360px]:line-clamp-2 min-[360px]:text-2xl sm:text-3xl lg:text-4xl">{activo.titulo}</h2>
            {activo.texto && <p className="mt-2 hidden line-clamp-2 max-w-xl text-sm text-white/80 min-[360px]:block sm:text-base">{activo.texto}</p>}
            <div className="mt-4 flex flex-wrap items-center gap-2 min-[360px]:mt-5">
              <Link href={activo.href} className="btn btn-accent">
                {t("home.promoSee")} <Icon name="arrowRight" size={17} />
              </Link>
              <Link href="/ofertas" className="btn btn-outline-light hidden sm:inline-flex">
                {t("home.promoAll")}
              </Link>
            </div>
          </div>

          {n > 1 && (
            <>
              <div className="absolute right-3 top-3 z-20 hidden gap-1 sm:flex">
                <button type="button" onClick={() => mover(-1)} aria-label={t("home.promoPrev")} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
                  <Icon name="chevronLeft" size={18} />
                </button>
                <button type="button" onClick={() => mover(1)} aria-label={t("home.promoNext")} className="grid h-9 w-9 place-items-center rounded-full bg-white/15 text-white backdrop-blur transition hover:bg-white/25">
                  <Icon name="chevronRight" size={18} />
                </button>
              </div>
              <div className="absolute bottom-4 right-5 z-20 flex gap-1.5">
                {items.map((_, idx) => (
                  <button
                    key={idx}
                    type="button"
                    onClick={() => setI(idx)}
                    aria-label={`${t("home.promoSlide")} ${idx + 1}`}
                    aria-current={idx === i}
                    className={`h-2 rounded-full transition-all ${idx === i ? "w-6 bg-white" : "w-2 bg-white/45 hover:bg-white/70"}`}
                  />
                ))}
              </div>
            </>
          )}
        </div>
      </div>
    </section>
  );
}
