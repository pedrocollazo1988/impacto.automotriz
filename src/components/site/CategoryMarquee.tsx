"use client";

import Link from "next/link";
import Icon from "@/components/brand/Icon";

export type CategoryMarqueeProps = {
  categories: { slug: string; name: string }[];
  allLabel?: string;
};

/**
 * Franja de categorías: un acceso fijo a todo el catálogo y, al lado, una
 * marquesina que se desplaza despacio. La lista se pinta dos veces para que
 * el bucle de -50% no tenga saltos; la copia extra queda fuera del árbol
 * accesible y del orden de tabulación.
 */
export default function CategoryMarquee({
  categories,
  allLabel = "Todos los productos",
}: CategoryMarqueeProps) {
  return (
    <nav
      aria-label="Categorías de productos"
      className="bg-white print:hidden"
    >
      <div className="flex items-center gap-2 px-3 py-1.5">
        <Link
          href="/catalogo"
          className="flex min-h-10 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-bold text-navy transition hover:bg-slate-100"
        >
          <Icon name="grid" size={15} />
          <span className="whitespace-nowrap">{allLabel}</span>
        </Link>

        <span aria-hidden className="h-4 w-px shrink-0 bg-slate-200" />

        <div
          role="region"
          aria-label="Categorías"
          className="min-w-0 flex-1 overflow-x-auto [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        >
          {categories.length > 0 && (
            <div className="flex w-max animate-[marquee_42s_linear_infinite] hover:[animation-play-state:paused] focus-within:[animation-play-state:paused] motion-reduce:[animation:none]">
              {[0, 1].map((copy) => (
                <ul
                  key={copy}
                  aria-hidden={copy === 1}
                  className={`flex shrink-0 items-center gap-2 pr-2 ${copy === 1 ? "motion-reduce:hidden" : ""}`}
                >
                  {categories.map((category, index) => (
                    <li key={`${copy}-${index}`}>
                      <Link
                        href={`/catalogo?categoria=${encodeURIComponent(category.slug)}`}
                        tabIndex={copy === 1 ? -1 : undefined}
                        className="chip whitespace-nowrap px-3 py-2 text-[12.5px]"
                      >
                        {category.name}
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
