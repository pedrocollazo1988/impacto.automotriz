"use client";
import { createElement, useEffect } from "react";

// Visor 3D (GLB) con realidad aumentada en móviles compatibles. `poster` es la foto de respaldo mientras carga.
export default function ModelViewer({ src, alt, poster }: { src: string; alt: string; poster?: string }) {
  useEffect(() => { import("@google/model-viewer"); }, []);
  return createElement("model-viewer", {
    src, alt, poster, ar: true, "ar-modes": "webxr scene-viewer quick-look", "camera-controls": true,
    "touch-action": "pan-y", loading: "lazy", reveal: "interaction", style: { width: "100%", height: "420px", background: "#eef1f6", borderRadius: "12px" },
  });
}
