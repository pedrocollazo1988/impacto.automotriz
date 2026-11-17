"use client";
import { useState } from "react";
import { useCart } from "./CartProvider";

export type VariantOpt = { id: number; name: string; priceUsd: number | null; stock: number };
export default function AddToCart({ productId, stock, basePriceUsd, variants = [] }: { productId: number; stock: number; basePriceUsd: number; variants?: VariantOpt[] }) {
  const { add } = useCart(); const [qty, setQty] = useState(1); const [done, setDone] = useState(false); const [email, setEmail] = useState(""); const [msg, setMsg] = useState("");
  const [vid, setVid] = useState<number | "">(variants.find((v) => v.stock > 0)?.id ?? "");
  const v = variants.find((x) => x.id === vid); const avail = variants.length ? (v?.stock ?? 0) : stock;

  if (stock <= 0) return (
    <div className="space-y-2"><p className="text-sm font-medium text-red-600">Agotado</p>
      <div className="flex gap-2"><input className="flex-1 rounded border px-3 py-2 text-sm" placeholder="Tu correo para avisarte" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="rounded bg-navy px-4 py-2 text-sm text-white" onClick={async () => { const r = await fetch("/api/stock-alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, email }) }); setMsg(r.ok ? "¡Te avisaremos!" : "Revisa el correo"); }}>Avisarme</button></div>
      <p className="text-sm text-slate-600">{msg}</p></div>);
  return (
    <div className="space-y-3">
      {variants.length > 0 && <select className="w-full rounded border px-3 py-2 text-sm" value={vid} onChange={(e) => { setVid(Number(e.target.value)); setQty(1); }}>
        {variants.map((x) => <option key={x.id} value={x.id} disabled={x.stock <= 0}>{x.name}{x.priceUsd != null ? ` — ${x.priceUsd.toFixed(2)} USD` : ""}{x.stock <= 0 ? " (agotado)" : ""}</option>)}</select>}
      {variants.length > 0 && <p className="text-2xl font-bold">{(v?.priceUsd ?? basePriceUsd).toFixed(2)} USD</p>}
      <div className="flex items-center gap-3">
        <input type="number" min={1} max={Math.min(99, avail)} value={qty} onChange={(e) => setQty(Math.max(1, Math.min(avail, Number(e.target.value) || 1)))} className="w-20 rounded border px-3 py-2" />
        <button disabled={!avail} className="rounded-lg bg-navy px-6 py-2.5 font-semibold text-white disabled:opacity-40" onClick={() => { add(productId, qty, v?.id ?? null); setDone(true); setTimeout(() => setDone(false), 1500); }}>{done ? "Añadido ✓" : "Añadir al carrito"}</button>
      </div>
    </div>);
}
