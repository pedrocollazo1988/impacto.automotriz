import Image from "next/image";
import Link from "next/link";

type Props = { variant?: "dark" | "light"; size?: "sm" | "md" | "lg"; href?: string | null; tagline?: boolean; animated?: boolean; className?: string };

const SIZES = { sm: { mark: 34, name: "text-base sm:text-lg", tag: "text-[9px]" }, md: { mark: 44, name: "text-xl sm:text-2xl", tag: "text-[10px]" }, lg: { mark: 72, name: "text-3xl sm:text-4xl", tag: "text-xs" } };

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
          width={s.mark * 3}
          height={Math.round(s.mark * 3 * 0.636)}
          priority
          className="relative transition-transform duration-300 group-hover/logo:scale-[1.06]"
          style={{ height: s.mark, width: "auto" }}
        />
      </span>
      <span className="flex flex-col leading-none">
        <span className={`font-display font-extrabold tracking-tight ${s.name} ${light ? "text-white" : "text-navy"}`}>
          IMPACTO<span className={light ? " text-[#f0c98a]" : " text-[color:var(--color-accent)]"}>·</span>AUTOMOTRIZ
        </span>
        {tagline && (
          <span className={`mt-1 font-mono uppercase tracking-[0.28em] ${s.tag} ${light ? "text-white/55" : "text-slate-500"}`}>
            Piezas · Accesorios · Eléctrico
          </span>
        )}
      </span>
    </span>
  );
  return href ? <Link href={href} aria-label="Impacto Automotriz — inicio" className="shrink-0">{inner}</Link> : inner;
}
