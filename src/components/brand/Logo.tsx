import Image from "next/image";
import Link from "next/link";

type Props = { variant?: "dark" | "light"; size?: "sm" | "md" | "lg"; href?: string | null; tagline?: boolean; animated?: boolean; className?: string };

const SIZES = { sm: { mark: 34, name: "text-[13px] min-[400px]:text-base sm:text-lg", tag: "text-[9px]" }, md: { mark: 44, name: "text-xl sm:text-2xl", tag: "text-[10px]" }, lg: { mark: 72, name: "text-3xl sm:text-4xl", tag: "text-xs" } };

// El PNG mide 260x165 (1.576:1). Declarar el tamaño CSS real hace que Next emita
// un srcset 1x/2x ajustado en vez de servir 256 px para un símbolo de 54.
const anchoMarca = (alto: number) => Math.round(alto * 1.576);

// Marca: símbolo + logotipo tipográfico. `animated` añade un halo giratorio (para el hero).
export default function Logo({ variant = "dark", size = "md", href = "/", tagline = true, animated = false, className = "" }: Props) {
  const light = variant === "light";
  const s = SIZES[size];
  const inner = (
    <span className={`group/logo inline-flex items-center gap-3 ${className}`}>
      <span className="relative inline-flex shrink-0 items-center justify-center">
        {animated && <span aria-hidden className="absolute -inset-3 rounded-full bg-[conic-gradient(from_0deg,rgba(10,132,255,.55),transparent_35%,transparent_65%,rgba(255,176,32,.5))] blur-md opacity-70 animate-[spin_9s_linear_infinite]" />}
        <Image
          src={light ? "/brand/mark-white.png" : "/brand/mark.png"}
          alt="Impacto Automotriz"
          width={anchoMarca(s.mark)}
          height={s.mark}
          priority
          className="relative transition-transform duration-300 group-hover/logo:scale-[1.06]"
          style={{ height: s.mark, width: "auto" }}
        />
      </span>
      <span className="hidden min-[360px]:flex min-w-0 flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight ${s.name} ${light ? "text-white" : "text-navy"}`}>
          IMPACTO<span className={light ? " text-[color:var(--color-brand-hi)]" : " text-[color:var(--color-brand)]"}>·</span>AUTOMOTRIZ
        </span>
        {tagline && (
          <span className={`mt-1 font-mono uppercase tracking-[0.28em] ${s.tag} ${light ? "text-white/55" : "text-slate-500"}`}>
            Piezas · Accesorios · Eléctrico
          </span>
        )}
      </span>
    </span>
  );
  // Sin aria-label: el nombre accesible sale del texto visible (WCAG 2.5.3).
  return href ? <Link href={href} className="flex min-h-12 min-w-0 shrink items-center lg:min-h-0"><span className="sr-only">Inicio — </span>{inner}</Link> : inner;
}
