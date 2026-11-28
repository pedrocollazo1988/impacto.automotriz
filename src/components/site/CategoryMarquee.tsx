"use client";

import Link from "next/link";
import { useEffect, useMemo, useRef, useState } from "react";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

export type CategoryMarqueeProps = {
  categories: { slug: string; name: string }[];
  allLabel?: string;
};

const normalizar = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// Una categoría puede llegar repetida con el mismo slug (o, sin slug, con el
// mismo nombre). Se conserva la primera aparición. Dos categorías distintas que
// compartan nombre pero tengan slug diferente se conservan ambas.
function deduplicar(categories: CategoryMarqueeProps["categories"]) {
  const vistos = new Set<string>();
  const unicas: CategoryMarqueeProps["categories"] = [];
  for (const categoria of categories) {
    const slug = normalizar(categoria.slug ?? "");
    const nombre = normalizar(categoria.name ?? "");
    if (!slug && !nombre) continue;
    const clave = slug ? `s:${slug}` : `n:${nombre}`;
    if (vistos.has(clave)) continue;
    vistos.add(clave);
    unicas.push(categoria);
  }
  return unicas;
}

/**
 * Franja de categorías: un acceso fijo a todo el catálogo y, al lado, una
 * marquesina que se desplaza despacio. La lista se pinta dos veces solo cuando
 * una pasada ya cubre el ancho visible (lo necesario para que el bucle de -50%
 * no tenga saltos); si no, se deja estática para no mostrar la misma categoría
 * dos veces a la vez. La copia extra queda fuera del árbol accesible.
 */
export default function CategoryMarquee({
  categories,
  allLabel,
}: CategoryMarqueeProps) {
  const { t } = usePreferences();
  const unicas = useMemo(() => deduplicar(categories), [categories]);
  const regionRef = useRef<HTMLDivElement>(null);
  const listaRef = useRef<HTMLUListElement>(null);
  const [bucle, setBucle] = useState(false);

  useEffect(() => {
    const region = regionRef.current;
    const lista = listaRef.current;
    if (!region || !lista) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) {
      setBucle(false);
      return;
    }

    const medir = () => setBucle(lista.scrollWidth > region.clientWidth + 1);
    medir();

    if (typeof ResizeObserver === "undefined") {
      window.addEventListener("resize", medir);
      return () => window.removeEventListener("resize", medir);
    }

    const observer = new ResizeObserver(medir);
    observer.observe(region);
    observer.observe(lista);
    window.addEventListener("resize", medir);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", medir);
    };
  }, [unicas]);

  return (
    <nav
      aria-label={t("marquee.title")}
      className="bg-white print:hidden"
    >
      <div className="flex items-center gap-2 py-2">
        <Link
          href="/catalogo"
          className="-ml-2.5 flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-bold text-navy transition hover:bg-slate-100"
        >
          <Icon name="grid" size={15} />
          <span className="whitespace-nowrap">{allLabel ?? t("marquee.all")}</span>
        </Link>

        <span aria-hidden className="h-4 w-px shrink-0 bg-slate-200" />

        <div
          ref={regionRef}
          role="region"
          aria-label={t("marquee.region")}
          className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {unicas.length > 0 && (
            <div
              className={`flex w-max ${
                bucle
                  ? "animate-[marquee_42s_linear_infinite] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused]"
                  : ""
              }`}
            >
              {[0, ...(bucle ? [1] : [])].map((copy) => (
                <ul
                  key={copy}
                  ref={copy === 0 ? listaRef : undefined}
                  aria-hidden={copy === 1}
                  className="flex shrink-0 items-center gap-2 pr-2"
                >
                  {unicas.map((categoria) => (
                    <li key={`${copy}-${categoria.slug || categoria.name}`}>
                      <Link
                        href={`/catalogo?categoria=${encodeURIComponent(categoria.slug)}`}
                        tabIndex={copy === 1 ? -1 : undefined}
                        className="chip whitespace-nowrap px-3 py-2 text-[12.5px]"
                      >
                        {categoria.name}
                      </Link>
                    </li>
                  ))}
                </ul>
              ))}
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
