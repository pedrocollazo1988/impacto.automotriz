"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/brand/Icon";

// Giro 360 con las fotos reales del vehículo: una toma por fotograma
// (public/products/360/<sku>-01.webp, -02, ...). Sin secuencia se muestra la
// foto principal: girar una sola foto plana la deja de canto a los 90°.
export default function Photo360({ src, frames, alt }: { src?: string; frames: string[]; alt: string }) {
  const total = frames.length;
  const [indice, setIndice] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [auto, setAuto] = useState(true);
  const ultimo = useRef<number | null>(null);
  const resto = useRef(0);

  const avanzar = useCallback((pasos: number) => {
    if (!total) return;
    setIndice((i) => (((i + pasos) % total) + total) % total);
  }, [total]);

  const iniciar = (x: number) => { setAuto(false); setArrastrando(true); ultimo.current = x; resto.current = 0; };
  const seguir = (x: number) => {
    if (ultimo.current === null || !total) return;
    const acumulado = x - ultimo.current + resto.current;
    const pasos = Math.trunc(acumulado / 10);
    if (pasos) { avanzar(pasos); resto.current = acumulado - pasos * 10; }
    else resto.current = acumulado;
  };
  const soltar = () => { setArrastrando(false); ultimo.current = null; resto.current = 0; };

  useEffect(() => {
    if (!auto || arrastrando || total < 2) return;
    const t = setInterval(() => avanzar(1), 110);
    return () => clearInterval(t);
  }, [auto, arrastrando, total, avanzar]);

  if (!total) {
    return (
      <div className="card relative aspect-square overflow-hidden">
        {src ? (
          <Image src={src} alt={alt} fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover" priority unoptimized={src.endsWith(".svg")} />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-400">Sin foto todavía</div>
        )}
      </div>
    );
  }

  return (
    <div
      className="card relative aspect-square select-none overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200"
      style={{ cursor: arrastrando ? "grabbing" : "grab", touchAction: "pan-y" }}
      onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); iniciar(e.clientX); }}
      onPointerMove={(e) => seguir(e.clientX)}
      onPointerUp={soltar}
      onPointerCancel={soltar}
      onPointerLeave={soltar}
    >
      {frames.map((f, k) => (
        <Image key={f} src={f} alt={k === 0 ? alt : ""} fill sizes="(max-width:768px) 100vw, 45vw"
          className="object-cover" priority={k === 0} draggable={false}
          style={{ opacity: k === indice ? 1 : 0 }} aria-hidden={k !== indice} />
      ))}
      <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-medium text-white shadow">
        <Icon name="cube" size={12} /> Arrastra para girar 360°
      </span>
    </div>
  );
}
