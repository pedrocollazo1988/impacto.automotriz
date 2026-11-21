"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Image from "next/image";
import Icon from "@/components/brand/Icon";
import { inputCls } from "@/components/admin/ui";

export type PInit = { id?: number; sku: string; name: string; description: string; priceUsd: number; compareAtUsd: number | null; stock: number; lowStockAt: number; images: string[];
  variants: { sku: string; name: string; priceUsd: number | null; stock: number }[]; specs: Record<string, string> | null; featured: boolean; active: boolean; categoryName: string; brandName: string; fits: { make: string; model: string; yearFrom: number; yearTo: number }[] };
const EMPTY: PInit = { sku: "", name: "", description: "", priceUsd: 0, compareAtUsd: null, stock: 0, lowStockAt: 3, images: [], variants: [], specs: null, featured: false, active: true, categoryName: "", brandName: "", fits: [] };

export default function ProductForm({ initial = EMPTY, categories, brands }: { initial?: PInit; categories: string[]; brands: string[] }) {
  const router = useRouter(); const [f, setF] = useState(initial); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [fotos, setFotos] = useState<string[]>(initial.images);
  const [subiendo, setSubiendo] = useState(false);
  const [arrastrando, setArrastrando] = useState(false);
  const [specs, setSpecs] = useState(Object.entries(initial.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n"));
  const [variants, setVariants] = useState(initial.variants.map((v) => `${v.sku};${v.name};${v.priceUsd ?? ""};${v.stock}`).join("\n"));
  const [up, setUp] = useState("");
  const upload = async (files: FileList | null) => {
    if (!files?.length) return;
    setErr(""); setUp("");
    setSubiendo(true);
    try {
      const urls: string[] = [];
      for (const file of Array.from(files)) {
        const fd = new FormData(); fd.append("file", file);
        const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
        const j = await r.json().catch(() => ({}));
        if (!r.ok) throw new Error(j.error ?? `No se pudo subir ${file.name} (HTTP ${r.status})`);
        urls.push(j.url);
      }
      setFotos((p) => [...p, ...urls]); setUp(`${urls.length} foto${urls.length > 1 ? "s" : ""} añadida${urls.length > 1 ? "s" : ""}`);
    } catch (e) {
      setUp(""); setErr(e instanceof Error ? e.message : "No se pudo subir el archivo");
    } finally { setSubiendo(false); }
  };
  const quitarFoto = (i: number) => setFotos((p) => p.filter((_, n) => n !== i));
  const moverFoto = (i: number, d: number) => setFotos((p) => {
    const a = [...p]; const j = i + d;
    if (j < 0 || j >= a.length) return p;
    [a[i], a[j]] = [a[j], a[i]]; return a;
  });
  const [fits, setFits] = useState(initial.fits.map((x) => `${x.make};${x.model};${x.yearFrom};${x.yearTo}`).join("\n"));
  const set = <K extends keyof PInit>(k: K, v: PInit[K]) => setF((p) => ({ ...p, [k]: v }));

  const save = async () => {
    setBusy(true); setErr("");
    try {
      const body = {
        ...f, images: fotos, brandName: f.brandName || null,
        specs: Object.fromEntries(specs.split("\n").map((l) => l.split(/:(.*)/s).map((s) => s.trim())).filter(([k, v]) => k && v)),
        variants: variants.split("\n").map((l) => l.split(";").map((s) => s.trim())).filter((a) => a.length >= 4 && a[0] && a[1]).map(([sku, name, price, stock]) => ({ sku, name, priceUsd: price ? Number(price.replace(",", ".")) : null, stock: Number(stock) || 0 })),
        fits: fits.split("\n").map((l) => l.split(";").map((s) => s.trim())).filter((a) => a.length === 4).map(([make, model, a, b]) => ({ make, model, yearFrom: +a, yearTo: +b })),
      };
      const r = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.details ? "Revisa los campos obligatorios" : j.error);
      router.push("/admin/productos"); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); } finally { setBusy(false); }
  };
  const i = inputCls; const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block space-y-1"><span className="text-xs font-medium text-slate-600">{t}</span>{children}</label>;
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
      {/* Medios: fotos y modelo 3D. */}
      <section className="md:col-span-2 rounded-xl border border-slate-200 bg-white p-4">
        <header className="mb-3 flex items-center justify-between gap-3">
          <div>
            <h3 className="flex items-center gap-2 text-sm font-semibold text-navy"><Icon name="image" size={15} /> Fotos del producto</h3>
            <p className="mt-0.5 text-xs text-slate-500">La primera es la principal en el catálogo. JPG, PNG o WebP hasta 5 MB.</p>
          </div>
          <label className={`btn btn-primary btn-sm ${subiendo ? "opacity-60" : ""}`}>
            <Icon name={subiendo ? "spinner" : "upload"} size={13} className={subiendo ? "animate-spin" : ""} />
            {subiendo ? "Subiendo…" : "Subir fotos"}
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" disabled={subiendo} onChange={(e) => { void upload(e.target.files); e.currentTarget.value = ""; }} />
          </label>
        </header>

        {fotos.length > 0 ? (
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-4">
            {fotos.map((url, i) => (
              <li key={url} className="group relative overflow-hidden rounded-lg border border-slate-200 bg-slate-50">
                <div className="relative aspect-square">
                  <Image src={url} alt={`Foto ${i + 1}`} fill sizes="160px" className="object-cover" unoptimized={url.endsWith(".svg")} />
                  {i === 0 && <span className="absolute left-1.5 top-1.5 rounded bg-navy/85 px-1.5 py-0.5 text-[10px] font-semibold uppercase tracking-wide text-white">Principal</span>}
                </div>
                <div className="flex items-center justify-between gap-1 border-t border-slate-200 bg-white p-1.5">
                  <button type="button" onClick={() => moverFoto(i, -1)} disabled={i === 0} className="iconbtn" aria-label="Mover antes" title="Mover antes"><Icon name="chevronLeft" size={13} /></button>
                  <button type="button" onClick={() => moverFoto(i, 1)} disabled={i === fotos.length - 1} className="iconbtn" aria-label="Mover después" title="Mover después"><Icon name="chevronRight" size={13} /></button>
                  <button type="button" onClick={() => quitarFoto(i)} className="iconbtn text-red-600 hover:bg-red-50" aria-label="Quitar foto" title="Quitar foto"><Icon name="trash" size={13} /></button>
                </div>
              </li>
            ))}
          </ul>
        ) : (
          <label
            onDragOver={(e) => { e.preventDefault(); setArrastrando(true); }}
            onDragLeave={() => setArrastrando(false)}
            onDrop={(e) => { e.preventDefault(); setArrastrando(false); void upload(e.dataTransfer.files); }}
            className={`flex cursor-pointer flex-col items-center gap-2 rounded-lg border-2 border-dashed px-4 py-10 text-center transition-colors ${arrastrando ? "border-navy bg-navy/5" : "border-slate-300 hover:border-navy/40 hover:bg-slate-50"}`}
          >
            <Icon name="image" size={26} className="text-slate-400" />
            <span className="text-sm font-medium text-navy">Arrastra las fotos aquí o pulsa para elegirlas</span>
            <span className="text-xs text-slate-500">Sin fotos, el catálogo muestra un marcador genérico.</span>
            <input type="file" accept="image/jpeg,image/png,image/webp" multiple className="hidden" onChange={(e) => { void upload(e.target.files); e.currentTarget.value = ""; }} />
          </label>
        )}
      </section>

      <L t="Especificaciones (una por línea: Medida: 16 pulgadas)"><textarea rows={4} className={i} value={specs} onChange={(e) => setSpecs(e.target.value)} /></L>
      <L t="Compatibilidad (una por línea: Marca;Modelo;desde;hasta)"><textarea rows={4} className={`${i} font-mono`} value={fits} onChange={(e) => setFits(e.target.value)} /></L>
      <div className="md:col-span-2"><L t="Variantes (opcional; una por línea: SKU;Nombre;Precio (vacío = el del producto);Existencias). Con variantes, las existencias del producto son la suma de ellas."><textarea rows={4} className={`${i} font-mono`} value={variants} onChange={(e) => setVariants(e.target.value)} placeholder="LLA-16-R;Rojo 16 pulgadas;45;4" /></L></div>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />Destacado en portada</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />Visible en la tienda</label>
      <div className="md:col-span-2 space-y-2">{err && <p className="text-sm text-red-600">{err}</p>}<button disabled={busy} onClick={save} className="btn btn-primary">{busy ? "Guardando…" : "Guardar producto"}</button></div>
    </div>);
}
