"use client";
import Image from "next/image";
import { useCallback, useEffect, useRef, useState } from "react";
import Icon from "@/components/brand/Icon";
import { envolver, iniciarArrastre, pasosDeArrastre, type EstadoArrastre } from "@/lib/arrastre";
import { usePreferences } from "@/components/site/Preferences";

// Giro 360 con dos fuentes posibles:
//  - una secuencia de fotos (una toma por fotograma), y
//  - un vídeo grabado girando la pieza, que es mucho más barato: un MP4 de 2 MB
//    sustituye a 36 fotogramas de 200 KB. El arrastre mueve el vídeo, así que se
//    siente igual que la secuencia pero sin descargar decenas de imágenes.
// Sin secuencia se muestra la foto principal: girar una sola foto plana la deja
// de canto a los 90°.
export default function Photo360({ src, frames, video, alt }: { src?: string; frames: string[]; video?: string | null; alt: string }) {
  const { t } = usePreferences();
  const txt = (key: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t(key));
  const total = frames.length;
  const [indice, setIndice] = useState(0);
  const [arrastrando, setArrastrando] = useState(false);
  const [auto, setAuto] = useState(true);
  const arrastre = useRef<EstadoArrastre | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const avanzar = useCallback((pasos: number) => {
    if (!total) return;
    setIndice((i) => envolver(i + pasos, total));
  }, [total]);

  const iniciar = (x: number) => { setAuto(false); setArrastrando(true); arrastre.current = iniciarArrastre(x); };
  const seguir = (x: number) => {
    if (!arrastre.current || !total) return;
    const { pasos, estado } = pasosDeArrastre(arrastre.current, x);
    arrastre.current = estado;
    if (pasos) avanzar(pasos);
  };
  const soltar = () => { setArrastrando(false); arrastre.current = null; };

  // Con vídeo, arrastrar equivale a recorrer el tiempo: se mueve currentTime en
  // vez de cambiar de fotograma.
  const seguirVideo = (x: number) => {
    const v = videoRef.current;
    if (!v || !v.duration || Number.isNaN(v.duration)) return;
    if (!arrastre.current) return;
    const { pasos, estado } = pasosDeArrastre(arrastre.current, x);
    arrastre.current = estado;
    if (!pasos) return;
    const fotogramas = Math.max(12, v.duration * 12);
    v.currentTime = (v.currentTime + (pasos / fotogramas) * v.duration + v.duration) % v.duration;
  };

  useEffect(() => {
    if (!auto || arrastrando || total < 2) return;
    const timer = setInterval(() => avanzar(1), 110);
    return () => clearInterval(timer);
  }, [auto, arrastrando, total, avanzar]);

  // Quitar el atributo autoPlay no detiene un vídeo que ya está en marcha: sin
  // esto, al arrastrar el tiempo seguiría corriendo y el giro se iría solo.
  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    if (arrastrando) v.pause();
    else if (auto) void v.play().catch(() => {});
  }, [arrastrando, auto]);

  if (video) {
    return (
      <div
        className="card relative aspect-square select-none overflow-hidden bg-black"
        style={{ cursor: arrastrando ? "grabbing" : "grab", touchAction: "pan-y" }}
        // Con vídeo no se apaga el giro automático: al soltar debe seguir
        // reproduciéndose, no quedarse congelado en el último fotograma.
        onPointerDown={(e) => { e.currentTarget.setPointerCapture?.(e.pointerId); setArrastrando(true); arrastre.current = iniciarArrastre(e.clientX); }}
        onPointerMove={(e) => seguirVideo(e.clientX)}
        onPointerUp={soltar}
        onPointerCancel={soltar}
        onPointerLeave={soltar}
      >
        <video ref={videoRef} src={video} className="h-full w-full object-contain" muted loop playsInline preload="metadata"
          autoPlay={auto} aria-label={txt("v360.aria", { name: alt })} />
        <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-medium text-white shadow">
          <Icon name="refresh" size={12} /> {t("v360.drag")}
        </span>
      </div>
    );
  }

  if (!total) {
    return (
      <div className="card relative aspect-square overflow-hidden">
        {src ? (
          <Image src={src} alt={alt} fill sizes="(max-width:768px) 100vw, 45vw" className="object-cover" priority unoptimized={src.endsWith(".svg")} />
        ) : (
          <div className="grid h-full place-items-center bg-gradient-to-br from-slate-100 to-slate-200 text-sm text-slate-400">{t("v360.noPhoto")}</div>
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
        <Icon name="cube" size={12} /> {t("v360.drag")}
      </span>
    </div>
  );
}
