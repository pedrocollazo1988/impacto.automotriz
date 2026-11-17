"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type CartItem = { productId: number; variantId?: number | null; qty: number };
type Ctx = { items: CartItem[]; count: number; add: (id: number, qty?: number, variantId?: number | null) => void; setQty: (id: number, qty: number, variantId?: number | null) => void; remove: (id: number, variantId?: number | null) => void; clear: () => void };
const C = createContext<Ctx | null>(null);
export const useCart = () => { const c = useContext(C); if (!c) throw new Error("CartProvider ausente"); return c; };
const same = (i: CartItem, id: number, v?: number | null) => i.productId === id && (i.variantId ?? null) === (v ?? null);

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]); const [ready, setReady] = useState(false);
  useEffect(() => {
    try { const v = JSON.parse(localStorage.getItem("cart") ?? "[]"); if (Array.isArray(v)) setItems(v.filter((i) => Number.isInteger(i?.productId) && Number.isInteger(i?.qty) && i.qty > 0 && (i.variantId == null || Number.isInteger(i.variantId)))); } catch {}
    setReady(true);
  }, []);
  useEffect(() => { if (ready) try { localStorage.setItem("cart", JSON.stringify(items)); } catch {} }, [items, ready]);
  const add = (id: number, qty = 1, v: number | null = null) => setItems((p) => p.some((i) => same(i, id, v)) ? p.map((i) => same(i, id, v) ? { ...i, qty: Math.min(99, i.qty + qty) } : i) : [...p, { productId: id, variantId: v, qty }]);
  const setQty = (id: number, qty: number, v?: number | null) => setItems((p) => p.map((i) => same(i, id, v) ? { ...i, qty: Math.max(1, Math.min(99, qty)) } : i));
  const remove = (id: number, v?: number | null) => setItems((p) => p.filter((i) => !same(i, id, v)));
  return <C.Provider value={{ items, count: items.reduce((s, i) => s + i.qty, 0), add, setQty, remove, clear: () => setItems([]) }}>{children}</C.Provider>;
}
