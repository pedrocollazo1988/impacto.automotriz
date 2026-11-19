"use client";
import { createElement, useEffect, useRef, useState } from "react";

// Visor 3D (GLB) con realidad aumentada en móviles compatibles. `poster` es la foto de respaldo mientras carga.
export default function ModelViewer({ src, alt, poster }: { src: string; alt: string; poster?: string }) {
  const ref = useRef<HTMLElement>(null);
  const [ready, setReady] = useState(false);
  useEffect(() => { import("@google/model-viewer"); }, []);
  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const onLoad = () => setReady(true);
    el.addEventListener("load", onLoad);
    return () => el.removeEventListener("load", onLoad);
  }, [src]);
  return (
    <div className="relative">
      {createElement("model-viewer", {
        ref, src, alt, poster, ar: true, "ar-modes": "webxr scene-viewer quick-look", "camera-controls": true,
        "touch-action": "pan-y", "auto-rotate": true, "rotation-per-second": "18deg", loading: "lazy", reveal: "auto",
        "shadow-intensity": "1", "environment-image": "neutral", "camera-orbit": "0deg 72deg 105%",
        style: { width: "100%", height: "420px", background: "linear-gradient(160deg,#eef1f6,#dde4ef)", borderRadius: "12px" },
      })}
      <span className={`pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-medium text-white shadow transition-opacity ${ready ? "opacity-100" : "opacity-0"}`}>
        Arrastra para girar · pellizca para acercar
      </span>
    </div>
  );
}
