"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";
import Modelo3D from "@/components/Modelo3D";
import Photo360 from "@/components/Photo360";
import ProductGallery from "@/components/ProductGallery";
import { ETIQUETA_VISTA, type Vista } from "@/lib/viewer";
import { hayGiro360 } from "@/lib/medios";

type Props = {
  images: string[];
  videos?: string[];
  name: string;
  model3dUrl?: string | null;
  model3dVideo?: string | null;
  frames: string[];
  spin360Video?: string | null;
  initial: Vista;
};

// Elige qué se enseña en la ficha. Las pestañas solo aparecen para los medios que
// existen de verdad: ofrecer "3D" sin modelo sería un botón que no hace nada.
export default function ProductViewer({
  images, videos = [], name, model3dUrl, model3dVideo, frames, spin360Video, initial,
}: Props) {
  // Un vídeo en el panel 3D cumple la misma función que el GLB: el visitante ve la
  // pieza girando. Por eso cualquiera de los dos habilita la pestaña.
  const fuente3d = model3dUrl || model3dVideo || null;
  const hay360 = hayGiro360(frames, spin360Video);

  const disponibles: Vista[] = ["photos"];
  if (fuente3d) disponibles.push("model3d");
  if (hay360) disponibles.push("spin360");

  const [vista, setVista] = useState<Vista>(disponibles.includes(initial) ? initial : "photos");

  // Patrón ARIA de pestañas: flechas para moverse, Inicio/Fin a los extremos.
  const alTeclear = (e: React.KeyboardEvent, i: number) => {
    const paso = e.key === "ArrowRight" ? 1 : e.key === "ArrowLeft" ? -1 : 0;
    if (!paso && e.key !== "Home" && e.key !== "End") return;
    e.preventDefault();
    const destino = e.key === "Home" ? 0 : e.key === "End" ? disponibles.length - 1 : (i + paso + disponibles.length) % disponibles.length;
    setVista(disponibles[destino]);
    document.getElementById(`vista-tab-${disponibles[destino]}`)?.focus();
  };

  return (
    <div className="space-y-3">
      {disponibles.length > 1 && (
        <div role="tablist" aria-label="Cómo ver el producto" className="flex flex-wrap gap-1.5">
          {disponibles.map((v, k) => (
            <button
              key={v}
              id={`vista-tab-${v}`}
              role="tab"
              type="button"
              aria-selected={vista === v}
              aria-controls="vista-panel"
              tabIndex={vista === v ? 0 : -1}
              onKeyDown={(e) => alTeclear(e, k)}
              onClick={() => setVista(v)}
              className={`flex items-center gap-1.5 rounded-full border px-3 py-1.5 text-xs font-semibold transition ${
                vista === v
                  ? "border-[color:var(--color-action)] bg-[color:var(--color-action)] text-white"
                  : "border-slate-200 bg-white text-slate-600 hover:border-[color:var(--color-action)]/50"
              }`}
            >
              <Icon name={v === "model3d" ? "cube" : v === "spin360" ? "refresh" : "image"} size={13} />
              {ETIQUETA_VISTA[v]}
            </button>
          ))}
        </div>
      )}

      <div id="vista-panel" role="tabpanel" aria-labelledby={`vista-tab-${vista}`}>
        {vista === "model3d" && fuente3d ? (
          <Modelo3D src={fuente3d} poster={images[0]} alt={name} />
        ) : vista === "spin360" && hay360 ? (
          <Photo360 src={images[0]} frames={frames} video={spin360Video} alt={name} />
        ) : (
          <ProductGallery images={images} videos={videos} name={name} />
        )}
      </div>
    </div>
  );
}
