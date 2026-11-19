"use client";
import { useState } from "react";
import Image from "next/image";
import Icon from "@/components/brand/Icon";

// Galería de la ficha: miniatura activa grande + tira de miniaturas. Si hay modelo 3D, lo anuncia.
export default function ProductGallery({ images, name, has3d }: { images: string[]; name: string; has3d?: boolean }) {
  const list = images.length ? images : ["/placeholder.svg"];
  const [i, setI] = useState(0);
  const src = list[Math.min(i, list.length - 1)];
  return (
    <div className="space-y-3">
      <div className="card group relative aspect-square overflow-hidden">
        <Image src={src} alt={name} fill sizes="(max-width:768px) 100vw, 40vw" className="object-cover transition-transform duration-500 group-hover:scale-105" unoptimized={src.endsWith(".svg")} priority />
        {has3d && (
          <span className="badge absolute left-3 top-3 flex items-center gap-1 bg-[color:var(--color-navy)] text-white shadow">
            <Icon name="cube" size={12} /> Vista 3D disponible
          </span>
        )}
      </div>
      {list.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {list.slice(0, 5).map((u, k) => (
            <button key={u} onClick={() => setI(k)} aria-label={`Imagen ${k + 1}`}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${k === i ? "border-[color:var(--color-accent)]" : "border-transparent opacity-70 hover:opacity-100"}`}>
              <Image src={u} alt="" fill sizes="80px" className="object-cover" unoptimized={u.endsWith(".svg")} />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
