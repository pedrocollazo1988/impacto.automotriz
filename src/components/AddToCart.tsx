"use client";
import { useState } from "react";
import { useCart } from "./CartProvider";
import Icon from "@/components/brand/Icon";

export type VariantOpt = { id: number; name: string; priceUsd: number | null; stock: number };

export default function AddToCart({ productId, stock, basePriceUsd, variants = [] }: { productId: number; stock: number; basePriceUsd: number; variants?: VariantOpt[] }) {
  const { add } = useCart();
  const [qty, setQty] = useState(1);
  const [done, setDone] = useState(false);
  const [email, setEmail] = useState("");
  const [msg, setMsg] = useState("");
  const [vid, setVid] = useState<number | "">(variants.find((v) => v.stock > 0)?.id ?? "");
  const v = variants.find((x) => x.id === vid);
  const avail = variants.length ? (v?.stock ?? 0) : stock;
  const price = v?.priceUsd ?? basePriceUsd;

  if (stock <= 0) return (
    <div className="space-y-3 rounded-xl border border-amber-200 bg-amber-50 p-4">
      <p className="flex items-center gap-2 text-sm font-semibold text-amber-800"><Icon name="info" size={16} /> Producto agotado</p>
      <p className="text-xs text-amber-700">Déjanos tu correo y te avisamos en cuanto llegue.</p>
      <div className="flex gap-2">
        <input className="input flex-1" placeholder="tu@correo.com" value={email} onChange={(e) => setEmail(e.target.value)} />
        <button className="btn btn-primary" onClick={async () => { const r = await fetch("/api/stock-alert", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, email }) }); setMsg(r.ok ? "¡Listo! Te avisaremos." : "Revisa el correo"); }}>Avisarme</button>
      </div>
      {msg && <p className="text-sm text-amber-800">{msg}</p>}
    </div>
  );

  return (
    <div className="space-y-4">
      {variants.length > 0 && (
        <div>
          <p className="eyebrow mb-2 !text-[10px] text-slate-400">Elige una opción</p>
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
        {avail > 0 && <span className="text-xs font-medium text-[color:var(--color-ok)]">{avail} disponibles</span>}
      </p>
      <div className="flex flex-wrap items-center gap-3">
        <div className="flex items-center rounded-xl border border-slate-200 bg-white">
          <button aria-label="Menos" onClick={() => setQty((q) => Math.max(1, q - 1))} className="grid h-11 w-11 place-items-center text-slate-500 hover:text-navy"><Icon name="minus" size={16} /></button>
          <input type="number" min={1} max={Math.min(99, avail)} value={qty} aria-label="Cantidad"
            onChange={(e) => setQty(Math.max(1, Math.min(avail, Number(e.target.value) || 1)))}
            className="h-11 w-14 border-x border-slate-200 text-center text-sm outline-none" />
          <button aria-label="Más" onClick={() => setQty((q) => Math.min(Math.min(99, avail), q + 1))} className="grid h-11 w-11 place-items-center text-slate-500 hover:text-navy"><Icon name="plus" size={16} /></button>
        </div>
        <button disabled={!avail} className="btn btn-primary flex-1 disabled:opacity-40" onClick={() => { add(productId, qty, v?.id ?? null); setDone(true); setTimeout(() => setDone(false), 1800); }}>
          {done ? <><Icon name="check" size={18} /> Añadido</> : <><Icon name="cart" size={18} /> Añadir al carrito</>}
        </button>
      </div>
      <p className="flex items-center gap-2 text-xs text-slate-400"><Icon name="shield" size={14} /> Precio y existencias verificados en el servidor al confirmar el pedido.</p>
    </div>
  );
}
