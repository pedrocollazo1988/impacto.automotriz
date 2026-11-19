"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";
import ModelViewer from "@/components/ModelViewer";

export type PInit = { id?: number; sku: string; name: string; description: string; priceUsd: number; compareAtUsd: number | null; stock: number; lowStockAt: number; images: string[];
  variants: { sku: string; name: string; priceUsd: number | null; stock: number }[]; model3dUrl: string | null; specs: Record<string, string> | null; featured: boolean; active: boolean; categoryName: string; brandName: string; fits: { make: string; model: string; yearFrom: number; yearTo: number }[] };
const EMPTY: PInit = { sku: "", name: "", description: "", priceUsd: 0, compareAtUsd: null, stock: 0, lowStockAt: 3, images: [], variants: [], model3dUrl: null, specs: null, featured: false, active: true, categoryName: "", brandName: "", fits: [] };

export default function ProductForm({ initial = EMPTY, categories, brands }: { initial?: PInit; categories: string[]; brands: string[] }) {
  const router = useRouter(); const [f, setF] = useState(initial); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [images, setImages] = useState(initial.images.join("\n"));
  const [specs, setSpecs] = useState(Object.entries(initial.specs ?? {}).map(([k, v]) => `${k}: ${v}`).join("\n"));
  const [variants, setVariants] = useState(initial.variants.map((v) => `${v.sku};${v.name};${v.priceUsd ?? ""};${v.stock}`).join("\n"));
  const [up, setUp] = useState("");
  const upload = async (files: FileList | null, kind: "img" | "glb") => {
    if (!files?.length) return; setUp("Subiendo…"); const urls: string[] = [];
    for (const file of Array.from(files)) { const fd = new FormData(); fd.append("file", file); const r = await fetch("/api/admin/upload", { method: "POST", body: fd }); const j = await r.json(); if (!r.ok) return setUp(j.error ?? "Error al subir"); urls.push(j.url); }
    if (kind === "img") setImages((p) => [p.trim(), ...urls].filter(Boolean).join("\n")); else set("model3dUrl", urls[0]); setUp("Listo ✓");
  };
  const [fits, setFits] = useState(initial.fits.map((x) => `${x.make};${x.model};${x.yearFrom};${x.yearTo}`).join("\n"));
  const set = <K extends keyof PInit>(k: K, v: PInit[K]) => setF((p) => ({ ...p, [k]: v }));

  const gen3d = async () => {
    if (!initial.id) return setErr("Guarda el producto primero para generar su modelo 3D");
    setUp("Generando modelo 3D…"); setErr("");
    try {
      const r = await fetch(`/api/admin/products/${initial.id}/model3d`, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ imageIndex: 0 }) });
      const j = await r.json(); if (!r.ok) throw new Error(j.error ?? "No se pudo generar");
      set("model3dUrl", j.url); setUp("Modelo 3D listo ✓");
    } catch (e) { setUp(""); setErr(e instanceof Error ? e.message : "Error al generar el 3D"); }
  };

  const save = async () => {
    setBusy(true); setErr("");
    try {
      const body = {
        ...f, images: images.split("\n").map((s) => s.trim()).filter(Boolean), model3dUrl: f.model3dUrl || null, brandName: f.brandName || null,
        specs: Object.fromEntries(specs.split("\n").map((l) => l.split(/:(.*)/s).map((s) => s.trim())).filter(([k, v]) => k && v)),
        variants: variants.split("\n").map((l) => l.split(";").map((s) => s.trim())).filter((a) => a.length >= 4 && a[0] && a[1]).map(([sku, name, price, stock]) => ({ sku, name, priceUsd: price ? Number(price.replace(",", ".")) : null, stock: Number(stock) || 0 })),
        fits: fits.split("\n").map((l) => l.split(";").map((s) => s.trim())).filter((a) => a.length === 4).map(([make, model, a, b]) => ({ make, model, yearFrom: +a, yearTo: +b })),
      };
      const r = await fetch("/api/admin/products", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const j = await r.json(); if (!r.ok) throw new Error(j.details ? "Revisa los campos obligatorios" : j.error);
      router.push("/admin/productos"); router.refresh();
    } catch (e) { setErr(e instanceof Error ? e.message : "Error"); } finally { setBusy(false); }
  };
  const i = "w-full rounded border px-3 py-2 text-sm"; const L = ({ t, children }: { t: string; children: React.ReactNode }) => <label className="block space-y-1"><span className="text-xs font-medium text-slate-600">{t}</span>{children}</label>;
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
      <L t="Fotos (URL por línea; la primera es la principal)"><div className="space-y-1"><textarea rows={4} className={`${i} font-mono`} value={images} onChange={(e) => setImages(e.target.value)} /><input type="file" accept="image/jpeg,image/png,image/webp" multiple onChange={(e) => upload(e.target.files, "img")} className="text-xs" /></div></L>
      <L t="Modelo 3D (archivo .glb)"><div className="space-y-2">
        <input className={i} value={f.model3dUrl ?? ""} onChange={(e) => set("model3dUrl", e.target.value)} placeholder="Pega una URL .glb o genera uno desde la foto" />
        <div className="flex flex-wrap items-center gap-2">
          <button type="button" onClick={gen3d} className="rounded bg-navy px-3 py-1.5 text-xs font-semibold text-white disabled:opacity-50" disabled={!initial.id}><Icon name="cube" size={12} /> Generar 3D desde la foto</button>
          {f.model3dUrl && <button type="button" onClick={() => set("model3dUrl", null)} className="rounded border px-3 py-1.5 text-xs">Quitar 3D</button>}
          <input type="file" accept=".glb" onChange={(e) => upload(e.target.files, "glb")} className="text-xs" />
        </div>
        {f.model3dUrl && <div className="h-44 overflow-hidden rounded-lg border bg-[#eef1f6]"><ModelViewer src={f.model3dUrl} alt={f.name || "Vista previa"} /></div>}
        <p className="text-xs text-slate-500">{up || (!initial.id && "Guarda el producto para poder generarlo.")}</p>
      </div></L>
      <L t="Especificaciones (una por línea: Medida: 16 pulgadas)"><textarea rows={4} className={i} value={specs} onChange={(e) => setSpecs(e.target.value)} /></L>
      <L t="Compatibilidad (una por línea: Marca;Modelo;desde;hasta)"><textarea rows={4} className={`${i} font-mono`} value={fits} onChange={(e) => setFits(e.target.value)} /></L>
      <div className="md:col-span-2"><L t="Variantes (opcional; una por línea: SKU;Nombre;Precio (vacío = el del producto);Existencias). Con variantes, las existencias del producto son la suma de ellas."><textarea rows={4} className={`${i} font-mono`} value={variants} onChange={(e) => setVariants(e.target.value)} placeholder="LLA-16-R;Rojo 16 pulgadas;45;4" /></L></div>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.featured} onChange={(e) => set("featured", e.target.checked)} />Destacado en portada</label>
      <label className="flex gap-2 text-sm"><input type="checkbox" checked={f.active} onChange={(e) => set("active", e.target.checked)} />Visible en la tienda</label>
      <div className="md:col-span-2 space-y-2">{err && <p className="text-sm text-red-600">{err}</p>}<button disabled={busy} onClick={save} className="rounded bg-navy px-6 py-2 font-semibold text-white disabled:opacity-50">{busy ? "Guardando…" : "Guardar producto"}</button></div>
    </div>);
}
