"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import Icon from "@/components/brand/Icon";

type Line = { productId: number; variantId: number | null; name: string; unitUsd: number; qty: number; stock: number; ok: boolean; totalUsd: number };

export default function Carrito() {
  const { items, setQty, remove } = useCart();
  const [data, setData] = useState<{ lines: Line[]; subtotalUsd: number; allOk: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  useEffect(() => {
    if (!items.length) { setData(null); setLoading(false); return; }
    setLoading(true);
    fetch("/api/cart/price", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) })
      .then((r) => r.json()).then((d) => { if (d.lines) setData(d); }).finally(() => setLoading(false));
  }, [items]);

  if (!items.length) return (
    <div className="container-x py-16">
      <div className="card mx-auto grid max-w-md place-items-center p-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="cart" size={30} /></span>
        <h1 className="mt-4 font-display text-xl font-bold text-navy">Tu carrito está vacío</h1>
        <p className="mt-1 text-sm text-slate-500">Explora el catálogo y añade las piezas que necesitas.</p>
        <Link href="/catalogo" className="btn btn-primary mt-5"><Icon name="grid" size={18} /> Ver catálogo</Link>
      </div>
    </div>
  );

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl font-extrabold text-navy">Carrito</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {loading && <p className="text-sm text-slate-400">Actualizando precios y existencias…</p>}
          {data?.lines.map((l) => (
            <div key={`${l.productId}-${l.variantId}`} className="card flex flex-wrap items-center gap-4 p-4">
              <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"><Icon name="box" size={22} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">{l.name}</p>
                <p className="mt-0.5 text-sm text-slate-500">{l.unitUsd.toFixed(2)} USD / unidad</p>
                {!l.ok && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><Icon name="info" size={13} /> Solo quedan {l.stock} disponibles</p>}
              </div>
              <div className="flex items-center rounded-xl border border-slate-200">
                <button aria-label="Menos" onClick={() => setQty(l.productId, Math.max(1, l.qty - 1), l.variantId, l.stock)} className="grid h-10 w-10 place-items-center text-slate-500 hover:text-navy"><Icon name="minus" size={15} /></button>
                <span className="grid h-10 w-10 place-items-center border-x border-slate-200 text-sm font-semibold">{l.qty}</span>
                <button aria-label="Más" disabled={l.qty >= l.stock} onClick={() => setQty(l.productId, l.qty + 1, l.variantId, l.stock)} className="grid h-10 w-10 place-items-center text-slate-500 hover:text-navy disabled:cursor-not-allowed disabled:opacity-30"><Icon name="plus" size={15} /></button>
              </div>
              <p className="w-24 text-right font-display font-extrabold text-navy">{l.totalUsd.toFixed(2)} <span className="text-xs font-bold text-slate-400">USD</span></p>
              <button aria-label="Quitar" onClick={() => remove(l.productId, l.variantId)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Icon name="trash" size={18} /></button>
            </div>
          ))}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-navy">Resumen</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-semibold">{data ? data.subtotalUsd.toFixed(2) : "0.00"} USD</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">Envío</dt><dd className="text-slate-400">Se calcula en el checkout</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base"><dt className="font-semibold">Total estimado</dt><dd className="font-display font-extrabold text-navy">{data ? data.subtotalUsd.toFixed(2) : "0.00"} USD</dd></div>
            </dl>
            {data?.allOk ? (
              <Link href="/checkout" className="btn btn-primary mt-5 w-full"><Icon name="check" size={18} /> Finalizar compra</Link>
            ) : (
              <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">Ajusta las cantidades marcadas para continuar.</p>
            )}
            <Link href="/catalogo" className="btn btn-ghost mt-2 w-full">Seguir comprando</Link>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400"><Icon name="shield" size={13} /> Pago seguro · precios verificados en el servidor</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
