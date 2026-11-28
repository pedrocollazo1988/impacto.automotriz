"use client";
import { useState } from "react";

type Props = { url: string | null; name: string; size?: number; redondo?: boolean };

/** Avatar del cliente con respaldo en la inicial: si la foto no carga, no se ve un icono roto. */
export default function Avatar({ url, name, size = 56, redondo = false }: Props) {
  const [roto, setRoto] = useState(false);
  const forma = redondo ? "rounded-full" : "rounded-2xl";
  const estilo = { width: size, height: size };

  if (!url || roto) {
    return (
      <span style={estilo} aria-hidden className={`grid shrink-0 place-items-center bg-gradient-to-br from-[color:var(--color-navy)] to-[color:var(--color-action)] font-display font-extrabold text-white ${forma} ${size >= 40 ? "text-xl" : "text-[10px]"}`}>
        {name.slice(0, 1).toUpperCase()}
      </span>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img src={url} alt="" width={size} height={size} referrerPolicy="no-referrer" onError={() => setRoto(true)} style={estilo} className={`shrink-0 object-cover ${forma}`} />
  );
}
