"use client";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import Icon from "@/components/brand/Icon";
import { waHref } from "@/lib/site";

const base = "group relative grid h-10 w-10 place-items-center rounded-xl text-navy transition hover:bg-[color:var(--color-action)] hover:text-white focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-action)] focus-visible:ring-offset-2";
const etiqueta = "pointer-events-none absolute right-full mr-2 hidden whitespace-nowrap rounded-lg bg-[color:var(--color-navy)] px-2.5 py-1 text-[11px] font-semibold text-white opacity-0 shadow-lg transition group-hover:opacity-100 lg:block";

export default function ActionRail() {
  const { items } = useCart();
  const count = items.reduce((n, i) => n + i.qty, 0);

  return (
    <nav aria-label="Acciones rápidas" className="fixed right-2 top-1/2 z-40 -translate-y-1/2 sm:right-4">
      <div className="flex flex-col items-center gap-0.5 rounded-2xl border border-slate-200/80 bg-white/90 p-1.5 shadow-[0_18px_50px_-18px_rgba(2,27,72,0.45)] backdrop-blur-md">
        <Link href="/preguntas-frecuentes" aria-label="Preguntas frecuentes" className={base}>
          <Icon name="info" size={19} />
          <span className={etiqueta}>Preguntas frecuentes</span>
        </Link>
        <a href={waHref("Hola, quiero hacer una consulta sobre sus productos")} target="_blank" rel="noopener" aria-label="Escribir por WhatsApp" className={base}>
          <Icon name="whatsapp" size={19} />
          <span className={etiqueta}>WhatsApp</span>
        </a>
        <button type="button" onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })} aria-label="Subir al inicio" className={base}>
          <Icon name="chevronRight" size={19} className="-rotate-90" />
          <span className={etiqueta}>Subir</span>
        </button>
        <span aria-hidden className="my-1 h-px w-6 bg-slate-200" />
        <Link href="/carrito" aria-label={count ? `Carrito, ${count} productos` : "Carrito"} className={base}>
          <Icon name="cart" size={19} />
          {count > 0 && <span className="absolute -right-0.5 -top-0.5 grid h-5 min-w-5 place-items-center rounded-full bg-[color:var(--color-action)] px-1 text-[10px] font-bold text-white ring-2 ring-white">{count}</span>}
          <span className={etiqueta}>Carrito</span>
        </Link>
      </div>
    </nav>
  );
}
