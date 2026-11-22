"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Icon from "@/components/brand/Icon";

const ZOOM = 2.4;

// Galería con lupa: al pasar el ratón, la foto se amplía en su propio marco y
// sigue al cursor. Se amplía en el sitio (no en un panel al lado) porque la ficha
// tiene dos columnas y un panel flotante taparía el título y el precio.
// En táctil no hay hover: ahí el gesto útil es abrir la foto a pantalla completa.
export default function ProductGallery({ images, name }: { images: string[]; name: string }) {
  const list = images.length ? images : ["/placeholder.svg"];
  const [i, setI] = useState(0);
  const [lupa, setLupa] = useState(false);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [grande, setGrande] = useState(false);
  const marco = useRef<HTMLDivElement>(null);
  const src = list[Math.min(i, list.length - 1)];

  const mover = useCallback((e: React.PointerEvent) => {
    const r = marco.current?.getBoundingClientRect();
    if (!r) return;
    const x = Math.min(100, Math.max(0, ((e.clientX - r.left) / r.width) * 100));
    const y = Math.min(100, Math.max(0, ((e.clientY - r.top) / r.height) * 100));
    setPos({ x, y });
  }, []);

  useEffect(() => {
    if (!grande) return;
    const cerrar = (e: KeyboardEvent) => { if (e.key === "Escape") setGrande(false); };
    document.addEventListener("keydown", cerrar);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", cerrar); document.body.style.overflow = previo; };
  }, [grande]);

  return (
    <div className="space-y-3">
      <div className="relative">
        <div
          ref={marco}
          className="card relative aspect-square overflow-hidden"
          onPointerEnter={(e) => { if (e.pointerType === "mouse") setLupa(true); }}
          onPointerLeave={() => setLupa(false)}
          onPointerMove={mover}
        >
          <Image
            src={src}
            alt={name}
            fill
            sizes="(max-width:768px) calc(100vw - 2rem), (max-width:1024px) 45vw, 40vw"
            className="object-cover transition-transform duration-150"
            unoptimized={src.endsWith(".svg")}
            priority
            draggable={false}
            style={lupa ? { transform: `scale(${ZOOM})`, transformOrigin: `${pos.x}% ${pos.y}%` } : undefined}
          />
          <button
            type="button"
            onClick={() => setGrande(true)}
            className="absolute bottom-3 right-3 flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-medium text-white shadow transition hover:bg-navy"
            aria-label="Ver la foto a pantalla completa"
          >
            <Icon name="search" size={12} /> Ampliar
          </button>
        </div>

      </div>

      {list.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {list.slice(0, 5).map((u, k) => (
            <button
              key={u}
              type="button"
              onClick={() => setI(k)}
              aria-label={`Imagen ${k + 1}`}
              aria-current={k === i}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${k === i ? "border-[color:var(--color-accent)]" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              <Image src={u} alt="" fill sizes="80px" className="object-cover" unoptimized={u.endsWith(".svg")} />
            </button>
          ))}
        </div>
      )}

      {grande && (
        <div
          role="dialog"
          aria-modal="true"
          aria-label={`Foto ampliada de ${name}`}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4"
          onClick={() => setGrande(false)}
        >
          <button
            type="button"
            onClick={() => setGrande(false)}
            autoFocus
            className="absolute right-4 top-4 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25"
            aria-label="Cerrar"
          >
            <Icon name="close" size={20} />
          </button>
          <div className="relative h-[85vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            <Image src={src} alt={name} fill sizes="90vw" className="object-contain" unoptimized={src.endsWith(".svg")} />
          </div>
        </div>
      )}
    </div>
  );
}
