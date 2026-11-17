"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";

type Line = { productId: number; variantId: number | null; name: string; unitUsd: number; qty: number; stock: number; ok: boolean; totalUsd: number };
export default function Carrito() {
  const { items, setQty, remove } = useCart(); const [data, setData] = useState<{ lines: Line[]; subtotalUsd: number; allOk: boolean } | null>(null);
  useEffect(() => {
    if (!items.length) { setData(null); return; }
    fetch("/api/cart/price", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }).then((r) => r.json()).then((d) => d.lines && setData(d));
  }, [items]);
  if (!items.length) return <p>Tu carrito está vacío. <Link className="text-navy underline" href="/catalogo">Ver catálogo</Link></p>;
  return (
    <div className="space-y-4"><h1 className="text-2xl font-bold text-navy">Carrito</h1>
      {data?.lines.map((l) => (
        <div key={`${l.productId}-${l.variantId}`} className="flex items-center justify-between gap-3 rounded-lg border p-3 text-sm">
          <div><b>{l.name}</b><br />{l.unitUsd.toFixed(2)} USD{!l.ok && <span className="ml-2 text-red-600">Solo quedan {l.stock}</span>}</div>
          <div className="flex items-center gap-3"><input type="number" min={1} value={l.qty} onChange={(e) => setQty(l.productId, Number(e.target.value), l.variantId)} className="w-16 rounded border px-2 py-1" /><b>{l.totalUsd.toFixed(2)}</b><button onClick={() => remove(l.productId, l.variantId)} className="text-red-600">Quitar</button></div>
        </div>))}
      {data && <div className="flex items-center justify-between"><p className="text-lg font-bold">Subtotal: {data.subtotalUsd.toFixed(2)} USD</p>{data.allOk ? <Link href="/checkout" className="rounded-lg bg-navy px-6 py-2.5 font-semibold text-white">Finalizar compra</Link> : <span className="text-sm text-red-600">Ajusta las cantidades para continuar</span>}</div>}
    </div>);
}
