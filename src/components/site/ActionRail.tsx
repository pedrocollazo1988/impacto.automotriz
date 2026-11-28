"use client";
import Link from "next/link";
import { useEffect, useState } from "react";
import { useCart } from "@/components/CartProvider";
import Icon from "@/components/brand/Icon";
import { waHref } from "@/lib/site";
import { usePreferences } from "@/components/site/Preferences";
import BackToTop from "@/components/site/BackToTop";

// El rail solo tiene sentido cuando la página ya se desplazó: en reposo tapa
// contenido y ofrece acciones que el usuario todavía no necesita.
const UMBRAL = 140;

const base = "group relative grid h-10 w-10 place-items-center rounded-xl text-navy transition hover:bg-[color:var(--color-action)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-action)] focus-visible:ring-offset-2";
const etiqueta = "pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-lg bg-[color:var(--color-navy)] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 lg:block";

export default function ActionRail() {
  const { items } = useCart();
  const { t } = usePreferences();
  const count = items.reduce((n, i) => n + i.qty, 0);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      setVisible(window.scrollY > UMBRAL);
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
  }, []);

  return (
    <nav
      aria-label={t("chrome.quickActions")}
      aria-hidden={!visible}
      inert={!visible}
      className={`fixed right-2 top-1/2 z-40 hidden -translate-y-1/2 transition-all duration-300 ease-out motion-reduce:transition-none sm:right-4 sm:block print:hidden ${
        visible ? "translate-x-0 opacity-100" : "pointer-events-none translate-x-4 opacity-0"
      }`}
    >
      <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_18px_50px_-18px_rgba(2,27,72,0.45)] backdrop-blur-md">
        <Link href="/preguntas-frecuentes" aria-label={t("rail.faq")} className={base}>
          <Icon name="info" size={19} />
          <span className={etiqueta}>{t("rail.faq")}</span>
        </Link>
        <a href={waHref(t("chrome.waMessage"))} target="_blank" rel="noopener" aria-label={t("rail.whatsapp")} className={base}>
          <Icon name="whatsapp" size={19} />
          <span className={etiqueta}>{t("rail.whatsapp")}</span>
        </a>
        <BackToTop floating={false} threshold={0} label={t("rail.up")} className="!h-10 !w-10" />
        <span aria-hidden className="my-1 h-px w-6 bg-slate-200" />
        <Link href="/carrito" aria-label={count ? `${t("header.cart")}, ${count}` : t("header.cart")} className={base}>
          <Icon name="cart" size={19} />
          {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--color-action)] px-1 text-[10px] font-bold text-white ring-2 ring-white">{count}</span>}
          <span className={etiqueta}>{t("header.cart")}</span>
        </Link>
      </div>
    </nav>
  );
}
