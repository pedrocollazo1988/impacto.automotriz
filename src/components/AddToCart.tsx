"use client";
import { useState } from "react";
import { useCart } from "./CartProvider";
import Icon from "@/components/brand/Icon";

export type VariantOpt = { id: number; name: string; priceUsd: number | null; stock: number };

export default function AddToCart({ productId, stock, basePriceUsd, variants = [] }: { productId: number; stock: number; basePriceUsd: number; variants?: VariantOpt[] }) {
  const { items, add } = useCart();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);
  const [vid, setVid] = useState<number | "">(variants.find((v) => v.stock > 0)?.id ?? "");
  const v = variants.find((x) => x.id === vid);
  const avail = variants.length ? (v ? Math.min(v.stock, stock) : 0) : stock;
  const enCarrito = items.find((i) => i.productId === productId && (i.variantId ?? null) === (v?.id ?? null))?.qty ?? 0;
  const restante = Math.max(0, avail - enCarrito);
  const maxQty = Math.max(1, Math.min(99, restante));
  const price = v?.priceUsd ?? basePriceUsd;
  const avisar = async () => {
    setErr(""); setMsg("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email.trim())) return setErr("Escribe un correo válido, por ejemplo nombre@correo.com.");
    setBusy(true);
    const r = await fetch("/api/stock-alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, email: email.trim() }) });
    setBusy(false);
    if (r.ok) { setMsg("¡Listo! Te avisaremos cuando vuelva a estar disponible."); setEmail(""); }
    else { const d = await r.json().catch(() => ({})); setErr(d.error ?? "No se pudo registrar el aviso. Inténtalo de nuevo."); }
  };

  if (stock <= 0) return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-800"><Icon name="info" size={16} /> Producto agotado</p>
      <p className="text-xs text-amber-700">Déjanos tu correo y te avisamos en cuanto llegue.</p>
      <div className="flex gap-2">
        <input className="input flex-1" type="email" autoComplete="email" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} aria-invalid={!!err} />
        <button className="btn btn-primary" disabled={busy} onClick={avisar}>{busy ? "Enviando…" : "Avisarme"}</button>
      </div>
      {err && <p role="alert" className="text-sm text-red-700">{err}</p>}
      {msg && <p role="status" className="text-sm text-emerald-700">{msg}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {variants.length > 0 && (
        <div>
          <p className="eyebrow mb-2 !text-[10px] text-slate-500">Elige una opción</p>
          <div className="flex flex-wrap gap-2">
            {variants.map((x) => (
              <button key={x.id} disabled={x.stock <= 0} onClick={() => { setVid(x.id); setQty(1); }}
                className={`chip ${vid === x.id ? "chip-active" : ""} ${x.stock <= 0 ? "cursor-not-allowed line-through opacity-50" : ""}`}>
                {x.name}{x.priceUsd != null && <span className="font-mono text-[10px] opacity-80">{x.priceUsd.toFixed(2)}</span>}
              </button>
            ))}
          </div>
        </div>
      )}
      <p className="flex items-baseline gap-2">
        <span className="font-display text-3xl font-extrabold text-navy">{price.toFixed(2)} <span className="text-base font-bold text-slate-500">USD</span></span>
        {avail > 0 && <span className="text-xs font-medium text-emerald-700">{restante > 0 ? `${restante} disponibles` : "Ya tienes el máximo en el carrito"}</span>}
        {avail <= 0 && <span className="text-xs font-medium text-red-600">Agotado en esta opción</span>}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-xl border border-slate-200 bg-white">
          <button aria-label="Menos" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-slate-500 hover:text-navy"><Icon name="minus" size={16} /></button>
          <input type="number" min={1} max={maxQty} value={Math.min(qty, maxQty)} aria-label="Cantidad"
            onChange={(e) => setQty(Math.max(1, Math.min(maxQty, Number(e.target.value) || 1)))}
            className="h-11 w-14 border-x border-slate-200 text-center text-sm outline-none" />
          <button aria-label="Más" onClick={() => setQty((q) => Math.min(maxQty, q + 1))} className="grid h-11 w-11 place-items-center text-slate-500 hover:text-navy"><Icon name="plus" size={16} /></button>
        </div>
        <button disabled={restante <= 0} className="btn btn-primary flex-1 disabled:opacity-40" onClick={() => { add(productId, Math.min(qty, restante), v?.id ?? null, avail); setDone(true); setTimeout(() => setDone(false), 1800); }}>
          {done ? <><Icon name="check" size={18} /> Añadido</> : <><Icon name="cart" size={18} /> Añadir al carrito</>}
        </button>
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-400"><Icon name="shield" size={14} /> Precio y existencias verificados en el servidor al confirmar el pedido.</p>
    </div>
  );
}
