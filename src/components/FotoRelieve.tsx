"use client";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import Icon from "@/components/brand/Icon";

// Giro de una foto real. No hay fotos desde otros ángulos ni modelo 3D: se
// estima la profundidad de la foto y, al arrastrar, cada píxel se desplaza
// según su distancia a la cámara. El ángulo está acotado a `anguloMax` porque
// más allá la foto deja de tener información y aparecerían huecos.
//
// El desplazamiento va en un shader (WebGL): hacerlo con canvas 2D píxel a píxel
// no llega a 60 fps. Sin WebGL se queda la foto quieta, que sigue siendo válida.

const VS = `attribute vec2 p; varying vec2 uv;
void main(){ uv = vec2(p.x*.5+.5, .5-p.y*.5); gl_Position = vec4(p,0.,1.); }`;

const FS = `precision mediump float;
varying vec2 uv;
uniform sampler2D texC, texD, texA;
uniform float ang, prof;
void main(){
  float d = texture2D(texD, uv).r;
  float z = mix(1.0, d, prof);
  float dx = (z - 1.0) * ang;
  vec2 s = vec2(uv.x + dx, uv.y + (z - 1.0) * abs(ang) * 0.06);
  vec3 orig = texture2D(texC, uv).rgb;
  vec3 movido = texture2D(texC, clamp(s, vec2(0.0), vec2(1.0))).rgb;
  // Solo se usa el píxel desplazado si sigue dentro del objeto; si se sale,
  // se queda el original. Así la silueta no se encoge ni arrastra el fondo.
  float dentro = texture2D(texA, clamp(s, vec2(0.0), vec2(1.0))).r;
  vec3 c = mix(orig, movido, dentro);
  // La silueta la manda el destino: el contorno queda igual de grande al girar.
  float a = texture2D(texA, uv).r;
  gl_FragColor = vec4(c * (1.0 - clamp((z - .75) * .28, 0.0, .22)), a);
}`;

type Props = { base: string; anguloMax: number; alt: string; prioridad?: boolean };

export default function FotoRelieve({ base, anguloMax, alt, prioridad }: Props) {
  const cont = useRef<HTMLDivElement>(null);
  const [listo, setListo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);

  useEffect(() => {
    const host = cont.current;
    if (!host) return;
    const quieto = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const cv = document.createElement("canvas");
    cv.width = 640;
    cv.height = 640;
    cv.className = "h-full w-full";
    const gl = cv.getContext("webgl", { alpha: true, premultipliedAlpha: false, antialias: true });
    if (!gl) return;

    const sh = (tipo: number, src: string) => {
      const s = gl.createShader(tipo)!;
      gl.shaderSource(s, src);
      gl.compileShader(s);
      if (!gl.getShaderParameter(s, gl.COMPILE_STATUS)) throw new Error(gl.getShaderInfoLog(s) ?? "shader");
      return s;
    };

    let prog: WebGLProgram | null = null;
    try {
      prog = gl.createProgram()!;
      gl.attachShader(prog, sh(gl.VERTEX_SHADER, VS));
      gl.attachShader(prog, sh(gl.FRAGMENT_SHADER, FS));
      gl.linkProgram(prog);
      gl.useProgram(prog);
    } catch {
      return;
    }

    const buf = gl.createBuffer();
    gl.bindBuffer(gl.ARRAY_BUFFER, buf);
    gl.bufferData(gl.ARRAY_BUFFER, new Float32Array([-1, -1, 1, -1, -1, 1, 1, 1]), gl.STATIC_DRAW);
    const loc = gl.getAttribLocation(prog, "p");
    gl.enableVertexAttribArray(loc);
    gl.vertexAttribPointer(loc, 2, gl.FLOAT, false, 0, 0);

    let vivo = true;
    const texturas: WebGLTexture[] = [];
    async function textura(url: string, unidad: number) {
      const img = new window.Image();
      img.src = url;
      await img.decode();
      if (!vivo) return;
      const t = gl!.createTexture()!;
      gl!.activeTexture(gl!.TEXTURE0 + unidad);
      gl!.bindTexture(gl!.TEXTURE_2D, t);
      gl!.pixelStorei(gl!.UNPACK_FLIP_Y_WEBGL, true);
      gl!.texImage2D(gl!.TEXTURE_2D, 0, gl!.RGBA, gl!.RGBA, gl!.UNSIGNED_BYTE, img);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_S, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_WRAP_T, gl!.CLAMP_TO_EDGE);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MIN_FILTER, gl!.LINEAR);
      gl!.texParameteri(gl!.TEXTURE_2D, gl!.TEXTURE_MAG_FILTER, gl!.LINEAR);
      texturas.push(t);
    }

    const uAng = gl.getUniformLocation(prog, "ang");
    const uProf = gl.getUniformLocation(prog, "prof");
    gl.uniform1i(gl.getUniformLocation(prog, "texC"), 0);
    gl.uniform1i(gl.getUniformLocation(prog, "texD"), 1);
    gl.uniform1i(gl.getUniformLocation(prog, "texA"), 2);

    // ang en unidades de UV: 1 = ancho completo. El límite real lo pone el ángulo
    // medido al generar los mapas, no un número elegido a ojo.
    const tope = Math.sin((anguloMax * Math.PI) / 180) * 0.55;

    const est = { actual: 0, objetivo: 0, t: 0, auto: !quieto };
    let raf = 0;

    function pintar() {
      gl!.viewport(0, 0, cv.width, cv.height);
      gl!.clearColor(0, 0, 0, 0);
      gl!.clear(gl!.COLOR_BUFFER_BIT);
      gl!.uniform1f(uAng, est.actual);
      gl!.uniform1f(uProf, 0.85);
      gl!.drawArrays(gl!.TRIANGLE_STRIP, 0, 4);
    }

    function bucle() {
      if (!vivo) return;
      if (est.auto) {
        est.objetivo = Math.sin(est.t) * tope;
        est.t += 0.01;
      }
      est.actual += (est.objetivo - est.actual) * 0.12;
      pintar();
      raf = requestAnimationFrame(bucle);
    }

    Promise.all([
      textura(`${base}/color.webp`, 0),
      textura(`${base}/profundidad.webp`, 1),
      textura(`${base}/recorte.webp`, 2),
    ]).then(() => {
      if (!vivo) return;
      host.appendChild(cv);
      setListo(true);
      bucle();
    }).catch(() => { /* la foto de respaldo ya está en pantalla */ });

    // Arrastre: solo horizontal, con el tope ya calculado.
    let x0 = 0, a0 = 0, activo = false;
    const abajo = (e: PointerEvent) => {
      activo = true; est.auto = false; x0 = e.clientX; a0 = est.objetivo;
      cv.setPointerCapture(e.pointerId);
      setArrastrando(true);
    };
    const mover = (e: PointerEvent) => {
      if (!activo) return;
      const d = ((e.clientX - x0) / cv.clientWidth) * 2;
      est.objetivo = Math.max(-tope, Math.min(tope, a0 + d * tope));
    };
    const arriba = () => { activo = false; setArrastrando(false); };
    cv.addEventListener("pointerdown", abajo);
    cv.addEventListener("pointermove", mover);
    cv.addEventListener("pointerup", arriba);
    cv.addEventListener("pointercancel", arriba);

    return () => {
      vivo = false;
      cancelAnimationFrame(raf);
      cv.removeEventListener("pointerdown", abajo);
      cv.removeEventListener("pointermove", mover);
      cv.removeEventListener("pointerup", arriba);
      cv.removeEventListener("pointercancel", arriba);
      cv.remove();
      texturas.forEach((t) => gl.deleteTexture(t));
      gl.getExtension("WEBGL_lose_context")?.loseContext();
    };
  }, [base, anguloMax]);

  return (
    <div
      ref={cont}
      className="card relative aspect-square select-none overflow-hidden bg-gradient-to-b from-slate-100 to-slate-200"
      style={{ cursor: arrastrando ? "grabbing" : "grab", touchAction: "pan-y" }}
    >
      {!listo && (
        <Image src={`${base}/color.webp`} alt={alt} fill sizes="(max-width:768px) 100vw, 45vw"
          className="object-contain" priority={prioridad} />
      )}
      <span className="pointer-events-none absolute bottom-3 left-3 flex items-center gap-1.5 rounded-full bg-navy/85 px-3 py-1.5 text-xs font-medium text-white shadow">
        <Icon name="cube" size={12} /> Arrastra para girar
      </span>
    </div>
  );
}
