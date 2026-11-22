"use client";
import { useEffect, useState } from "react";
import Image from "next/image";
import Icon from "@/components/brand/Icon";
import { esVideo } from "@/lib/medios";

// El visor de Google pesa ~300 KB: se carga solo cuando la ficha lo necesita.
// Si el modelo no llega a cargar (404, red caída) se vuelve a la foto, no a un hueco.
// Acepta también un vídeo: no todo el mundo tiene un GLB de su pieza, y un vídeo
// girando sobre el plato se ve igual de bien para decidir la compra.
export default function Modelo3D({ src, poster, alt }: { src: string; poster?: string; alt: string }) {
  const [listo, setListo] = useState(false);
  const [fallo, setFallo] = useState(false);
  const video = esVideo(src);

  useEffect(() => {
    if (video) return;
    let vivo = true;
    import("@google/model-viewer")
      .then(() => vivo && setListo(true))
      .catch(() => vivo && setFallo(true));
    return () => { vivo = false; };
  }, [video]);

  if (fallo) {
    return (
      <div className="card grid aspect-square place-items-center overflow-hidden">
        {poster ? (
          <Image src={poster} alt={alt} fill sizes="(max-width:1024px) 100vw, 45vw" className="object-cover" unoptimized={poster.endsWith(".svg")} />
        ) : (
          <p className="px-6 text-center text-sm text-slate-500">No se pudo cargar el modelo 3D.</p>
        )}
      </div>
    );
  }

  if (video) {
    return (
      <div className="card relative aspect-square overflow-hidden bg-black">
        <video src={src} className="h-full w-full object-contain" controls loop muted playsInline preload="metadata" poster={poster} aria-label={`Vídeo 3D de ${alt}`} />
        <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-medium text-white shadow">
          <Icon name="play" size={12} /> Vídeo de la pieza girando
        </span>
      </div>
    );
  }

  return (
    <div className="card relative aspect-square overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200">
      {!listo && (
        <div className="absolute inset-0 grid place-items-center">
          <span className="flex items-center gap-2 text-sm text-slate-500">
            <Icon name="spinner" size={16} className="animate-spin" /> Cargando visor 3D…
          </span>
        </div>
      )}
      {listo && (
        <model-viewer
          src={src}
          alt={`Modelo 3D de ${alt}`}
          poster={poster}
          camera-controls
          auto-rotate
          touch-action="pan-y"
          interaction-prompt="auto"
          shadow-intensity="1"
          exposure="1"
          style={{ width: "100%", height: "100%", backgroundColor: "transparent" }}
        />
      )}
      <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-medium text-white shadow">
        <Icon name="cube" size={12} /> Arrastra para girar el modelo
      </span>
    </div>
  );
}
