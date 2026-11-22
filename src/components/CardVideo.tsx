"use client";
import { useRef, useState } from "react";
import Image from "next/image";
import Icon from "@/components/brand/Icon";

// El vídeo de la tarjeta ocupa el marco completo, igual que la foto, para que no
// se vea una franja negra ni un recuadro más pequeño que el resto de tarjetas.
// Solo se descargan los metadatos: los bytes llegan al pasar el ratón, así una
// parrilla de 24 tarjetas no arrastra 24 vídeos en la primera carga.
export default function CardVideo({ src, poster, alt }: { src: string; poster: string; alt: string }) {
  const ref = useRef<HTMLVideoElement>(null);
  const [reproduciendo, setReproduciendo] = useState(false);

  const reproducir = () => { void ref.current?.play().catch(() => {}); };
  const pausar = () => {
    const v = ref.current;
    if (!v) return;
    v.pause();
    v.currentTime = 0;
  };

  return (
    <div className="absolute inset-0" onPointerEnter={reproducir} onPointerLeave={pausar}>
      <video
        ref={ref}
        src={src}
        muted
        loop
        playsInline
        preload="none"
        aria-label={alt}
        onPlaying={() => setReproduciendo(true)}
        onFocus={reproducir}
        onBlur={pausar}
        className="absolute inset-0 h-full w-full object-cover"
      />
      {/* El póster va con next/image para seguir optimizando la foto, y es
          pointer-events-none para no tapar el vídeo que hay debajo: si capturara
          el ratón, el hover nunca llegaría y el vídeo no arrancaría. */}
      {!reproduciendo && (
        <Image
          src={poster}
          alt={alt}
          fill
          sizes="(max-width:768px) calc(50vw - 1.5rem), (max-width:1024px) calc(33vw - 1.5rem), calc(25vw - 1.5rem)"
          className="pointer-events-none object-cover transition-transform duration-500 group-hover:scale-[1.06]"
          unoptimized={poster.endsWith(".svg")}
        />
      )}
      <span className="pointer-events-none absolute bottom-2 left-2 grid h-7 w-7 place-items-center rounded-full bg-navy/80 text-white shadow backdrop-blur-sm">
        <Icon name="play" size={12} />
      </span>
    </div>
  );
}
