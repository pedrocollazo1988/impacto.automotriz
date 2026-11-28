"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import Image from "next/image";
import Icon from "@/components/brand/Icon";
import { mediosDeFicha } from "@/lib/medios";
import { ZOOM_INICIAL, ZOOM_MAX, ZOOM_MIN, anchoParaZoom, origenEn, zoomConBoton, zoomConRueda } from "@/lib/lupa";
import { usePreferences } from "@/components/site/Preferences";

// Galería con lupa: al pasar el ratón, la foto se amplía en su propio marco y
// sigue al cursor. Se amplía en el sitio (no en un panel al lado) porque la ficha
// tiene dos columnas y un panel flotante taparía el título y el precio.
// En táctil no hay hover: ahí el gesto útil es abrir la foto a pantalla completa.
export default function ProductGallery({ images, videos = [], name }: { images: string[]; videos?: string[]; name: string }) {
  const { t } = usePreferences();
  const txt = (key: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t(key));
  const medios = mediosDeFicha(images, videos);
  const lista = medios.length ? medios : [{ url: "/placeholder.svg", tipo: "foto" as const }];
  // Si la ficha tiene vídeo, se abre en el vídeo: es lo primero que quiere ver
  // quien entra a comprobar cómo funciona la pieza. Si no, se abre en la foto.
  const [i, setI] = useState(() => Math.max(0, medios.findIndex((m) => m.tipo === "video")));
  const [lupa, setLupa] = useState(false);
  const [zoom, setZoom] = useState(ZOOM_INICIAL);
  const [pos, setPos] = useState({ x: 50, y: 50 });
  const [grande, setGrande] = useState(false);
  const marco = useRef<HTMLDivElement>(null);
  const [anchoMarco, setAnchoMarco] = useState(0);
  const actual = lista[Math.min(i, lista.length - 1)];
  const esVideoActual = actual.tipo === "video";

  const mover = useCallback((e: React.PointerEvent) => {
    const r = marco.current?.getBoundingClientRect();
    if (!r) return;
    setPos(origenEn(e.clientX - r.left, e.clientY - r.top, r.width, r.height));
  }, []);

  // La rueda amplía en vez de hacer scroll, pero solo con el cursor sobre la
  // foto: secuestrar la rueda en toda la ficha impediría bajar a leer la
  // descripción. passive:false porque hay que cancelar el scroll de la página.
  useEffect(() => {
    const el = marco.current;
    if (!el) return;
    const alRodar = (e: WheelEvent) => {
      if (e.ctrlKey) return; // el zoom del navegador (pinza del trackpad) manda
      e.preventDefault();
      setLupa(true);
      setZoom((z) => zoomConRueda(z, e.deltaY));
    };
    el.addEventListener("wheel", alRodar, { passive: false });
    return () => el.removeEventListener("wheel", alRodar);
  }, []);

  // El ancho real decide qué escalón del srcset pide el navegador. Sin esto, al
  // ampliar a 4x seguiría usando la imagen de 576 px y se vería borrosa.
  useEffect(() => {
    const el = marco.current;
    if (!el) return;
    const ro = new ResizeObserver(([e]) => setAnchoMarco(e.contentRect.width));
    ro.observe(el);
    setAnchoMarco(el.getBoundingClientRect().width);
    return () => ro.disconnect();
  }, []);

  useEffect(() => {
    if (!grande) return;
    const cerrar = (e: KeyboardEvent) => {
      if (e.key === "Escape") setGrande(false);
      if (e.key === "ArrowRight") setI((k) => (k + 1) % lista.length);
      if (e.key === "ArrowLeft") setI((k) => (k - 1 + lista.length) % lista.length);
    };
    document.addEventListener("keydown", cerrar);
    const previo = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => { document.removeEventListener("keydown", cerrar); document.body.style.overflow = previo; };
  }, [grande, lista.length]);

  const cambiar = (k: number) => { setI(k); setZoom(ZOOM_INICIAL); setLupa(false); };
  const ampliada = lupa && zoom > 1;

  return (
    <div className="space-y-3">
      <div
        ref={marco}
        className={`card relative overflow-hidden ${esVideoActual ? "aspect-video" : "aspect-square"}`}
        onPointerEnter={(e) => { if (e.pointerType === "mouse" && !esVideoActual) setLupa(true); }}
        onPointerLeave={() => setLupa(false)}
        onPointerMove={esVideoActual ? undefined : mover}
        style={esVideoActual ? undefined : { cursor: ampliada ? "zoom-out" : "zoom-in" }}
      >
        {esVideoActual ? (
          <video key={actual.url} src={actual.url} poster={images[0]} className="h-full w-full bg-black object-cover" controls autoPlay muted loop playsInline preload="metadata" aria-label={txt("gallery.videoOf", { name })} />
        ) : (
          <Image
            src={actual.url}
            alt={name}
            fill
            // En reposo se pide el tamaño real (carga ligera); solo al ampliar se
            // pide la resolución del zoom. Si no, la ficha descargaría 3840 px de
            // entrada y se perdería toda la optimización.
            sizes={anchoMarco ? `${Math.ceil(anchoMarco * (ampliada ? zoom : 1))}px` : "(max-width:768px) calc(100vw - 2rem), (max-width:1024px) 45vw, 40vw"}
            className="object-cover"
            unoptimized={actual.url.endsWith(".svg")}
            // 75 en reposo (carga rápida); 92 al ampliar, que es cuando se nota el detalle.
            quality={ampliada ? 92 : 75}
            priority={i === 0}
            draggable={false}
            style={{
              transform: ampliada ? `scale(${zoom})` : undefined,
              transformOrigin: `${pos.x}% ${pos.y}%`,
              // 120 ms: suficiente para que el salto no maree, corto para que la
              // imagen no vaya "flotando" detrás del cursor.
              transition: "transform 120ms ease-out",
              willChange: ampliada ? "transform" : undefined,
            }}
          />
        )}

        {/* Icono de lupa pegado al cursor: sin él no se adivina que la foto amplía. */}
        {!esVideoActual && lupa && (
          <span
            aria-hidden
            className="pointer-events-none absolute z-10 grid h-9 w-9 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-navy/80 text-white shadow-lg ring-1 ring-white/30 backdrop-blur-sm"
            style={{ left: `${pos.x}%`, top: `${pos.y}%` }}
          >
            <Icon name={ampliada ? "minus" : "search"} size={16} />
          </span>
        )}

        {/* La rueda no todo el mundo la descubre, y hay portátiles sin ella. */}
        {!esVideoActual && (
          <div className="absolute right-3 top-3 z-10 flex flex-col overflow-hidden rounded-full bg-navy/85 text-white shadow">
            <button type="button" onClick={() => { setLupa(true); setZoom((z) => zoomConBoton(z, true)); }} disabled={zoom >= ZOOM_MAX}
              className="grid h-8 w-8 place-items-center transition hover:bg-white/15 disabled:opacity-40" aria-label={t("gallery.zoomIn")}>
              <Icon name="plus" size={14} />
            </button>
            <button type="button" onClick={() => { setLupa(true); setZoom((z) => zoomConBoton(z, false)); }} disabled={zoom <= ZOOM_MIN}
              className="grid h-8 w-8 place-items-center transition hover:bg-white/15 disabled:opacity-40" aria-label={t("gallery.zoomOut")}>
              <Icon name="minus" size={14} />
            </button>
          </div>
        )}

        <button
          type="button"
          onClick={() => setGrande(true)}
          className="absolute bottom-3 right-3 z-10 flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-medium text-white shadow transition hover:bg-navy"
          aria-label={esVideoActual ? t("gallery.videoFull") : t("gallery.photoFull")}
        >
          <Icon name="search" size={12} /> {t("gallery.enlarge")}
        </button>
      </div>

      {lista.length > 1 && (
        <div className="grid grid-cols-5 gap-2">
          {lista.slice(0, 5).map((m, k) => (
            <button
              key={m.url}
              type="button"
              onClick={() => cambiar(k)}
              aria-label={m.tipo === "video" ? txt("gallery.videoN", { n: k + 1 }) : txt("gallery.imageN", { n: k + 1 })}
              aria-current={k === i}
              className={`relative aspect-square overflow-hidden rounded-xl border-2 transition ${k === i ? "border-[color:var(--color-action)]" : "border-transparent opacity-70 hover:opacity-100"}`}
            >
              {m.tipo === "video" ? (
                <>
                  <video src={m.url} className="h-full w-full object-cover" muted playsInline preload="metadata" aria-hidden />
                  <span className="absolute inset-0 grid place-items-center bg-black/25">
                    <span className="grid h-7 w-7 place-items-center rounded-full bg-white/90 text-navy shadow"><Icon name="play" size={13} /></span>
                  </span>
                </>
              ) : (
                <Image src={m.url} alt="" fill sizes="80px" className="object-cover" unoptimized={m.url.endsWith(".svg")} />
              )}
            </button>
          ))}
        </div>
      )}

      {grande && (
        <div role="dialog" aria-modal="true" aria-label={esVideoActual ? txt("gallery.expandedVideoOf", { name }) : txt("gallery.expandedPhotoOf", { name })}
          className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 p-4" onClick={() => setGrande(false)}>
          <button type="button" onClick={() => setGrande(false)} autoFocus
            className="absolute right-4 top-4 z-10 grid h-11 w-11 place-items-center rounded-full bg-white/15 text-white transition hover:bg-white/25" aria-label={t("gallery.close")}>
            <Icon name="close" size={20} />
          </button>
          <div className="relative h-[85vh] w-full max-w-4xl" onClick={(e) => e.stopPropagation()}>
            {esVideoActual ? (
              <video src={actual.url} className="h-full w-full object-contain" controls autoPlay playsInline aria-label={txt("gallery.videoOf", { name })} />
            ) : (
              // quality 95: a pantalla completa se nota el detalle, y solo se paga al abrir.
              <Image src={actual.url} alt={name} fill sizes="90vw" quality={95} className="object-contain" unoptimized={actual.url.endsWith(".svg")} />
            )}
          </div>
        </div>
      )}
    </div>
  );
}
