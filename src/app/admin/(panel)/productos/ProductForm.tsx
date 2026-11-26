"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Icon from "@/components/brand/Icon";
import { inputCls } from "@/components/admin/ui";
import { ETIQUETA_VISTA, VISTAS } from "@/lib/viewer";
import { MAX_FOTOGRAMAS_360, MAX_FOTOS, MAX_VIDEOS } from "@/lib/medios";

export type PInit = { id?: number; sku: string; name: string; description: string; priceUsd: number; compareAtUsd: number | null; stock: number; lowStockAt: number;
  images: string[]; videos?: string[]; model3dUrl?: string | null; model3dVideo?: string | null; spin360Frames?: string[]; spin360Video?: string | null;
  viewerMode?: string;
  variants: { sku: string; name: string; priceUsd: number | null; stock: number }[]; specs: Record<string, string> | null; featured: boolean; active: boolean; categoryName: string; brandName: string; fits: { make: string; model: string; yearFrom: number; yearTo: number }[] };

const EMPTY: PInit = { sku: "", name: "", description: "", priceUsd: 0, compareAtUsd: null, stock: 0, lowStockAt: 3, images: [], videos: [], model3dUrl: null, model3dVideo: null, spin360Frames: [], spin360Video: null, viewerMode: "photos", variants: [], specs: null, featured: false, active: true, categoryName: "", brandName: "", fits: [] };

// Vercel corta el cuerpo de una función en ~4,5 MB: un vídeo de 40 MB no pasa
// por /api/admin/upload. Con Blob configurado se sube directo desde el navegador.
// Se sube de uno en uno: en conexión mala, cinco a la vez no terminan ninguna.
async function subirArchivos(files: File[], directo: boolean): Promise<string[]> {
  const urls: string[] = [];
  for (const file of files) {
    if (directo) {
      const { upload } = await import("@vercel/blob/client");
      const blob = await upload(`productos/${file.name}`, file, {
        access: "public",
        handleUploadUrl: "/api/admin/upload/token",
        clientPayload: `${file.type}|${file.name}`,
      });
      urls.push(blob.url);
      continue;
    }
    const fd = new FormData(); fd.append("file", file);
    const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) throw new Error(j.error ?? `No se pudo subir ${file.name} (HTTP ${r.status})`);
    urls.push(j.url);
  }
  return urls;
}

type TipoSubida = "fotos" | "videos" | "frames" | "modelo" | "modeloVideo" | "video360";

const L = ({ t, children }: { t: string; children: React.ReactNode }) => (
  <label className="block space-y-1"><span className="text-xs font-medium text-slate-600">{t}</span>{children}</label>
);

const BotonSubir = ({ tipo, accept, texto, deshabilitado, subiendo, onFiles }: {
  tipo: "fotos" | "videos" | "frames"; accept: string; texto: string; deshabilitado?: boolean;
  subiendo: TipoSubida | null; onFiles: (files: FileList | null) => void;
}) => (
  <label className={`btn btn-primary btn-sm ${subiendo === tipo || deshabilitado ? "opacity-60" : ""}`}>
    <Icon name={subiendo === tipo ? "spinner" : "upload"} size={13} className={subiendo === tipo ? "animate-spin" : ""} />
    {subiendo === tipo ? "Subiendo…" : texto}
    <input type="file" accept={accept} multiple className="hidden" disabled={subiendo === tipo || deshabilitado}
      onChange={(e) => { onFiles(e.target.files); e.currentTarget.value = ""; }} />
  </label>
);

const Tarjeta = ({ url, i: k, total, alQuitar, alMover, etiqueta }: { url: string; i: number; total: number; alQuitar: () => void; alMover: (d: number) => void; etiqueta?: string }) => (
  <li className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
    <div className="relative aspect-square">
      <Image src={url} alt="" fill sizes="160px" className="object-cover" unoptimized={url.endsWith(".svg")} />
      {etiqueta && <span className="absolute left-1.5 top-1.5 rounded bg-navy/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">{etiqueta}</span>}
    </div>
    <div className="flex items-center justify-between gap-1 border-t border-slate-200 bg-white p-1.5">
      <button type="button" onClick={() => alMover(-1)} disabled={k === 0} className="iconbtn" aria-label="Mover antes"><Icon name="chevronLeft" size={13} /></button>
      <button type="button" onClick={() => alMover(1)} disabled={k === total - 1} className="iconbtn" aria-label="Mover después"><Icon name="chevronRight" size={13} /></button>
      <button type="button" onClick={alQuitar} className="iconbtn text-red-600 hover:bg-red-50" aria-label="Quitar"><Icon name="trash" size={13} /></button>
    </div>
  </li>
);

export default function ProductForm({ initial = EMPTY, categories, brands, blob = false }: { initial?: PInit; categories: string[]; brands: string[]; blob?: boolean }) {
  const router = useRouter(); const [f, setF] = useState(initial); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [fotos, setFotos] = useState<string[]>(initial.images);
  const [videos, setVideos] = useState<string[]>(initial.videos ?? []);
  const [frames360, setFrames360] = useState<string[]>(initial.spin360Frames ?? []);
  const [subiendo, setSubiendo] = useState<TipoSubida | null>(null);
  const [arrastrando, setArrastrando] = useState(false);
  const [specs, setSpecs] = useState(Object.entries(initial.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n"));
  const [variants, setVariants] = useState(initial.variants.map((v) => `${v.sku};${v.name};${v.priceUsd ?? ""};${v.stock}`).join("\n"));
  const [up, setUp] = useState("");
  const [fits, setFits] = useState(initial.fits.map((x) => `${x.make};${x.model};${x.yearFrom};${x.yearTo}`).join("\n"));
  const set = <K extends keyof PInit>(k: K, v: PInit[K]) => setF((p) => ({ ...p, [k]: v }));

  // Añade respetando el tope y dice cuántas se quedaron fuera: descartarlas en
  // silencio haría pensar que la subida falló.
  const anadir = (previos: string[], nuevos: string[], max: number) => {
    const caben = nuevos.slice(0, Math.max(0, max - previos.length));
    const sobran = nuevos.length - caben.length;
    setUp(sobran > 0 ? `${caben.length} añadido(s); ${sobran} no caben (máximo ${max}).` : `${caben.length} añadido(s).`);
    return [...previos, ...caben];
  };

  const subirVarios = async (tipo: "fotos" | "videos" | "frames", files: FileList | null) => {
    if (!files?.length) return;
    setErr(""); setUp(""); setSubiendo(tipo);
    try {
      const urls = await subirArchivos(Array.from(files), blob);
      if (tipo === "fotos") setFotos((p) => anadir(p, urls, MAX_FOTOS));
      else if (tipo === "videos") setVideos((p) => anadir(p, urls, MAX_VIDEOS));
      else setFrames360((p) => anadir(p, urls, MAX_FOTOGRAMAS_360));
    } catch (e) {
      setUp(""); setErr(e instanceof Error ? e.message : "No se pudo subir el archivo");
    } finally { setSubiendo(null); }
  };

  const subirUno = async (campo: "model3dUrl" | "model3dVideo" | "spin360Video", tipo: TipoSubida, file?: File | null) => {
    if (!file) return;
    setErr(""); setUp(""); setSubiendo(tipo);
    try {
      const [url] = await subirArchivos([file], blob);
      set(campo, url); setUp("Archivo añadido.");
    } catch (e) {
      setUp(""); setErr(e instanceof Error ? e.message : "No se pudo subir el archivo");
    } finally { setSubiendo(null); }
  };

  const quitar = (lista: string[], i: number) => lista.filter((_, n) => n !== i);
  const mover = (lista: string[], i: number, d: number) => {
    const a = [...lista]; const j = i + d;
    if (j < 0 || j >= a.length) return a;
    [a[i], a[j]] = [a[j], a[i]]; return a;
  };

  const save = async () => {
    setBusy(true); setErr("");
    try {
      const body = {
        ...f, images: fotos, videos, spin360Frames: frames360, brandName: f.brandName || null,
        model3dUrl: f.model3dUrl || null, model3dVideo: f.model3dVideo || null, spin360Video: f.spin360Video || null,
        specs: Object.fromEntries(specs.split("\n").map((l) => l.split(/:(.*)/s).map((s) => s.trim())).filter(([k, v]) => k && v)),
        variants: variants.split("\n").map((l) => l.split(";").map((s) => s.trim())).filter((a) => a.length >= 4 && a[0] && a[1]).map(([sku, name, price, stock]) => ({ sku, name, priceUsd: price ? Number(price.replace(",", ".")) : null, stock: Number(stock) || 0 })),
        fits: fits.split("\n").map((l) => l.split(";").map((s) => s.trim())).filter((a) => a.length === 4).map(([make, model, a, b]) => ({ make, model, yearFrom: +a, yearTo: +b })),
      };
      const r = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.details ? "Revisa los campos obligatorios" : j.error);
      router.push("/admin/productos"); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); } finally { setBusy(false); }
  };

  const i = inputCls;

  return (
    <div className="grid gap-4 md:grid-cols-2">
      <L t="Nombre"><input className={i} value={f.name} onChange={(e) => set("name", e.target.value)} /></L>
      <L t="Código / SKU"><input className={i} value={f.sku} onChange={(e) => set("sku", e.target.value)} /></L>
      <L t="Categoría (se crea si no existe)"><input list="cats" className={i} value={f.categoryName} onChange={(e) => set("categoryName", e.target.value)} /></L>
      <L t="Marca (opcional)"><input list="brands" className={i} value={f.brandName} onChange={(e) => set("brandName", e.target.value)} /></L>
      <datalist id="cats">{categories.map((c) => <option key={c} value={c} />)}</datalist><datalist id="brands">{brands.map((c) => <option key={c} value={c} />)}</datalist>
      <L t="Precio (USD)"><input type="number" step="0.01" className={i} value={f.priceUsd} onChange={(e) => set("priceUsd", Number(e.target.value))} /></L>
      <L t="Precio anterior tachado (opcional)"><input type="number" step="0.01" className={i} value={f.compareAtUsd ?? ""} onChange={(e) => set("compareAtUsd", e.target.value ? Number(e.target.value) : null)} /></L>
      <L t="Existencias"><input type="number" className={i} value={f.stock} onChange={(e) => set("stock", Number(e.target.value))} /></L>
      <L t="Avisar cuando queden"><input type="number" className={i} value={f.lowStockAt} onChange={(e) => set("lowStockAt", Number(e.target.value))} /></L>
      <div className="md:col-span-2"><L t="Descripción"><textarea rows={3} className={i} value={f.description} onChange={(e) => set("description", e.target.value)} /></L></div>

      <section className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy"><Icon name="image" size={15} /> Fotos del producto <span className="text-xs font-normal text-slate-400">{fotos.length}/{MAX_FOTOS}</span></h3>
            <p className="mt-0.5 text-xs text-slate-500">La primera es la principal en el catálogo. JPG, PNG o WebP hasta 5 MB.</p>
          </div>
          <BotonSubir tipo="fotos" accept="image/jpeg,image/png,image/webp" texto="Subir fotos" deshabilitado={fotos.length >= MAX_FOTOS} subiendo={subiendo} onFiles={(files) => void subirVarios("fotos", files)} />
        </header>
        {fotos.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-5">
            {fotos.map((url, k) => (
              <Tarjeta key={url} url={url} i={k} total={fotos.length} etiqueta={k === 0 ? "Principal" : undefined}
                alQuitar={() => setFotos(quitar(fotos, k))} alMover={(d) => setFotos(mover(fotos, k, d))} />
            ))}
          </ul>
        ) : (
          <label onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }} onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastrando(false); void subirVarios("fotos", e.dataTransfer.files); }}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${arrastrando ? "border-navy bg-navy/5" : "border-slate-300 hover:border-navy/40 hover:bg-slate-50"}`}>
            <Icon name="image" size={26} className="text-slate-400" />
            <span className="text-sm font-medium text-navy">Arrastra las fotos aquí o pulsa para elegirlas</span>
            <span className="text-xs text-slate-500">Hasta {MAX_FOTOS} fotos. Sin fotos, el catálogo muestra un marcador genérico.</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { void subirVarios("fotos", e.target.files); e.currentTarget.value = ""; }} />
          </label>
        )}
      </section>

      <section className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy"><Icon name="play" size={15} /> Vídeos <span className="text-xs font-normal text-slate-400">{videos.length}/{MAX_VIDEOS}</span></h3>
            <p className="mt-0.5 text-xs text-slate-500">MP4 o WebM hasta 40 MB. Salen como miniaturas junto a las fotos, con botón de reproducir.</p>
          </div>
          <BotonSubir tipo="videos" accept="video/mp4,video/webm" texto="Subir vídeos" deshabilitado={videos.length >= MAX_VIDEOS} subiendo={subiendo} onFiles={(files) => void subirVarios("videos", files)} />
        </header>
        {videos.length > 0 ? (
          <ul className="grid grid-cols-1 gap-3 sm:grid-cols-3">
            {videos.map((url, k) => (
              <li key={url} className="overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <video src={url} className="aspect-video w-full bg-black object-contain" controls preload="metadata" />
                <div className="flex items-center justify-between gap-1 border-t border-slate-200 bg-white p-1.5">
                  <button type="button" onClick={() => setVideos(mover(videos, k, -1))} disabled={k === 0} className="iconbtn" aria-label="Mover antes"><Icon name="chevronLeft" size={13} /></button>
                  <button type="button" onClick={() => setVideos(mover(videos, k, 1))} disabled={k === videos.length - 1} className="iconbtn" aria-label="Mover después"><Icon name="chevronRight" size={13} /></button>
                  <button type="button" onClick={() => setVideos(quitar(videos, k))} className="iconbtn text-red-600 hover:bg-red-50" aria-label="Quitar vídeo"><Icon name="trash" size={13} /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">Sin vídeos. Es opcional: un vídeo corto de la pieza girando vende más que tres fotos.</p>}
      </section>

      <section className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy"><Icon name="cube" size={15} /> Modelo 3D o vídeo 3D</h3>
            <p className="mt-0.5 text-xs text-slate-500">Un .glb/.gltf hasta 25 MB, o un vídeo MP4/WebM hasta 40 MB con la pieza girando. Cualquiera de los dos activa la pestaña «Visor 3D».</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className={`btn btn-ghost btn-sm ${subiendo === "modelo" ? "opacity-60" : ""}`}>
              <Icon name={subiendo === "modelo" ? "spinner" : "upload"} size={13} className={subiendo === "modelo" ? "animate-spin" : ""} />
              {subiendo === "modelo" ? "Subiendo…" : f.model3dUrl ? "Cambiar modelo" : "Subir modelo"}
              <input type="file" accept=".glb,.gltf,model/gltf-binary,model/gltf+json" className="hidden" disabled={subiendo === "modelo"}
                onChange={(e) => { void subirUno("model3dUrl", "modelo", e.target.files?.[0]); e.currentTarget.value = ""; }} />
            </label>
            <label className={`btn btn-ghost btn-sm ${subiendo === "modeloVideo" ? "opacity-60" : ""}`}>
              <Icon name={subiendo === "modeloVideo" ? "spinner" : "play"} size={13} className={subiendo === "modeloVideo" ? "animate-spin" : ""} />
              {subiendo === "modeloVideo" ? "Subiendo…" : f.model3dVideo ? "Cambiar vídeo 3D" : "Subir vídeo 3D"}
              <input type="file" accept="video/mp4,video/webm" className="hidden" disabled={subiendo === "modeloVideo"}
                onChange={(e) => { void subirUno("model3dVideo", "modeloVideo", e.target.files?.[0]); e.currentTarget.value = ""; }} />
            </label>
          </div>
        </header>
        <div className="space-y-2">
          {f.model3dUrl && (
            <div className="flex flex-wrap items-center gap-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
              <Icon name="cube" size={18} className="shrink-0 text-[color:var(--color-action-deep)]" />
              <code className="min-w-0 flex-1 truncate text-xs text-slate-600">{f.model3dUrl}</code>
              <a href={f.model3dUrl} target="_blank" rel="noopener" className="btn btn-ghost btn-sm">Ver</a>
              <button type="button" onClick={() => set("model3dUrl", null)} className="btn btn-ghost btn-sm !text-red-600"><Icon name="trash" size={13} /> Quitar</button>
            </div>
          )}
          {f.model3dVideo && (
            <div className="rounded-lg border border-slate-200 bg-slate-50 p-3">
              <div className="mb-2 flex flex-wrap items-center gap-3">
                <Icon name="play" size={18} className="shrink-0 text-[color:var(--color-action-deep)]" />
                <code className="min-w-0 flex-1 truncate text-xs text-slate-600">{f.model3dVideo}</code>
                <button type="button" onClick={() => set("model3dVideo", null)} className="btn btn-ghost btn-sm !text-red-600"><Icon name="trash" size={13} /> Quitar</button>
              </div>
              <video src={f.model3dVideo} className="aspect-video w-full rounded bg-black object-contain" controls preload="metadata" />
            </div>
          )}
          {!f.model3dUrl && !f.model3dVideo && (
            <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">Sin modelo ni vídeo 3D. La ficha enseñará solo fotos y vídeos.</p>
          )}
        </div>

        <fieldset className="mt-4">
          <legend className="text-xs font-medium text-slate-600">Qué se muestra al abrir la ficha</legend>
          <div className="mt-1.5 flex flex-wrap gap-2">
            {VISTAS.map((v) => {
              const noDisponible = (v === "model3d" && !f.model3dUrl && !f.model3dVideo) || (v === "spin360" && !f.spin360Video && frames360.length < 2);
              return (
                <label key={v} className={`flex items-center gap-2 rounded-lg border px-3 py-2 text-xs ${noDisponible ? "border-slate-200 bg-slate-50 text-slate-400" : "border-slate-300 text-slate-700 hover:border-navy/40"}`}>
                  <input type="radio" name="viewerMode" value={v} disabled={noDisponible} checked={(f.viewerMode ?? "photos") === v} onChange={() => set("viewerMode", v)} />
                  {ETIQUETA_VISTA[v]}
                  {noDisponible && <span className="text-[10px]">(sin medio)</span>}
                </label>
              );
            })}
          </div>
          <p className="mt-1.5 text-xs text-slate-500">El visitante puede cambiar de vista en la ficha; esto solo decide cuál ve primero.</p>
        </fieldset>
      </section>

      <section className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
        <header className="mb-3 flex flex-wrap items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy"><Icon name="refresh" size={15} /> Giro 360 <span className="text-xs font-normal text-slate-400">{frames360.length}/{MAX_FOTOGRAMAS_360}</span></h3>
            <p className="mt-0.5 text-xs text-slate-500">Lo más barato es un vídeo de la pieza girando (MP4/WebM, 40 MB). Si prefieres fotogramas, sube la secuencia: mínimo 8, máximo {MAX_FOTOGRAMAS_360}.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <label className={`btn btn-ghost btn-sm ${subiendo === "video360" ? "opacity-60" : ""}`}>
              <Icon name={subiendo === "video360" ? "spinner" : "play"} size={13} className={subiendo === "video360" ? "animate-spin" : ""} />
              {subiendo === "video360" ? "Subiendo…" : f.spin360Video ? "Cambiar vídeo 360" : "Subir vídeo 360"}
              <input type="file" accept="video/mp4,video/webm" className="hidden" disabled={subiendo === "video360"}
                onChange={(e) => { void subirUno("spin360Video", "video360", e.target.files?.[0]); e.currentTarget.value = ""; }} />
            </label>
            <BotonSubir tipo="frames" accept="image/jpeg,image/png,image/webp" texto="Subir fotogramas" deshabilitado={frames360.length >= MAX_FOTOGRAMAS_360} subiendo={subiendo} onFiles={(files) => void subirVarios("frames", files)} />
          </div>
        </header>
        {f.spin360Video && (
          <div className="mb-3 rounded-lg border border-slate-200 bg-slate-50 p-3">
            <div className="mb-2 flex flex-wrap items-center gap-3">
              <Icon name="refresh" size={18} className="shrink-0 text-[color:var(--color-action-deep)]" />
              <code className="min-w-0 flex-1 truncate text-xs text-slate-600">{f.spin360Video}</code>
              <button type="button" onClick={() => set("spin360Video", null)} className="btn btn-ghost btn-sm !text-red-600"><Icon name="trash" size={13} /> Quitar</button>
            </div>
            <video src={f.spin360Video} className="aspect-video w-full rounded bg-black object-contain" controls loop muted playsInline preload="metadata" />
            <p className="mt-1.5 text-xs text-slate-500">El vídeo manda sobre los fotogramas: se reproduce solo y el arrastre lo recorre.</p>
          </div>
        )}
        {frames360.length > 0 ? (
          <ul className="grid grid-cols-4 gap-2 sm:grid-cols-6 lg:grid-cols-9">
            {frames360.map((url, k) => (
              <Tarjeta key={url} url={url} i={k} total={frames360.length} etiqueta={k === 0 ? "1º" : undefined}
                alQuitar={() => setFrames360(quitar(frames360, k))} alMover={(d) => setFrames360(mover(frames360, k, d))} />
            ))}
          </ul>
        ) : <p className="rounded-lg bg-slate-50 px-3 py-4 text-center text-xs text-slate-500">Sin fotogramas. Con menos de 8 no hay giro creíble y la ficha no ofrecerá la pestaña 360.</p>}
      </section>

      <L t="Especificaciones (una por línea: Medida: 16 pulgadas)"><textarea rows={4} className={i} value={specs} onChange={(e) => setSpecs(e.target.value)} /></L>
      <L t="Compatibilidad (una por línea: Marca;Modelo;desde;hasta)"><textarea rows={4} className={`${i} font-mono`} value={fits} onChange={(e) => setFits(e.target.value)} /></L>
      <div className="md:col-span-2"><L t="Variantes (opcional; una por línea: SKU;Nombre;Precio (vacío = el del producto);Existencias). Con variantes, las existencias del producto son la suma de ellas."><textarea rows={4} className={`${i} font-mono`} value={variants} onChange={(e) => setVariants(e.target.value)} placeholder="LLA-16-R;Rojo 16 pulgadas;45;4" /></L></div>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />Destacado en portada</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />Visible en la tienda</label>
      <div className="md:col-span-2 space-y-2">
        {up && <p className="text-sm text-emerald-700">{up}</p>}
        {err && <p className="text-sm text-red-600">{err}</p>}
        <button disabled={busy} onClick={save} className="btn btn-primary">{busy ? "Guardando…" : "Guardar producto"}</button>
      </div>
    </div>
  );
}
