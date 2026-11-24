"use client";
import { createContext, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import { MAX_CANTIDAD } from "@/lib/cart";
import { track } from "@/lib/analytics";

export type CartItem = { productId: number; variantId?: number | null; qty: number };
type Ctx = {
  items: CartItem[];
  count: number;
  add: (id: number, qty?: number, variantId?: number | null, max?: number) => void;
  setQty: (id: number, qty: number, variantId?: number | null, max?: number) => void;
  remove: (id: number, variantId?: number | null) => void;
  clear: () => void;
  ttlHoras: number;
  expiresAt: number | null;
  ready: boolean;
  aviso: string | null;
};
const C = createContext<Ctx | null>(null);
export const useCart = () => { const c = useContext(C); if (!c) throw new Error("CartProvider ausente"); return c; };
const same = (i: CartItem, id: number, v?: number | null) => i.productId === id && (i.variantId ?? null) === (v ?? null);
const valido = (i: unknown): i is CartItem => {
  const x = i as CartItem;
  return !!x && Number.isInteger(x?.productId) && Number.isInteger(x?.qty) && x.qty > 0 && (x.variantId == null || Number.isInteger(x.variantId));
};

export function CartProvider({ children, ttlHoras = 24, aviso = null }: { children: ReactNode; ttlHoras?: number; aviso?: string | null }) {
  const horas = Math.max(1, Math.floor(ttlHoras) || 24);
  const ttlMs = horas * 60 * 60 * 1000;
  const [items, setItems] = useState<CartItem[]>([]);
  const [savedAt, setSavedAt] = useState<number | null>(null);
  const [ready, setReady] = useState(false);
  const hidratado = useRef(false);

  useEffect(() => {
    let guardado: CartItem[] = [];
    let ts = Date.now();
    try {
      const v = JSON.parse(localStorage.getItem("cart") ?? "[]");
      if (Array.isArray(v)) guardado = v.filter(valido);
      const t = Number(localStorage.getItem("cart-saved-at"));
      if (Number.isFinite(t) && t > 0) ts = t;
    } catch {}
    if (guardado.length && Date.now() - ts >= ttlMs) {
      guardado = [];
      try { localStorage.removeItem("cart"); localStorage.removeItem("cart-saved-at"); } catch {}
    }
    setItems(guardado);
    setSavedAt(guardado.length ? ts : null);
    setReady(true);
    // El TTL solo se lee al montar: cambiarlo desde el panel se aplica al recargar.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!ready) return;
    // La primera pasada es la hidratación: no debe reiniciar el contador.
    if (!hidratado.current) { hidratado.current = true; return; }
    const ahora = Date.now();
    setSavedAt(items.length ? ahora : null);
    try {
      localStorage.setItem("cart", JSON.stringify(items));
      if (items.length) localStorage.setItem("cart-saved-at", String(ahora));
      else { localStorage.removeItem("cart-saved-at"); }
    } catch {}
  }, [items, ready]);

  useEffect(() => {
    if (!ready || !savedAt) return;
    const revisar = () => {
      if (Date.now() - savedAt < ttlMs) return;
      setItems([]);
      setSavedAt(null);
      try { localStorage.removeItem("cart"); localStorage.removeItem("cart-saved-at"); } catch {}
    };
    const t = window.setInterval(revisar, 60_000);
    revisar();
    return () => window.clearInterval(t);
  }, [ready, savedAt, ttlMs]);

  const add = (id: number, qty = 1, v: number | null = null, max = MAX_CANTIDAD) => {
    const tope = Math.max(0, Math.min(MAX_CANTIDAD, Math.floor(max)));
    if (tope <= 0) return;
    track("add_to_cart", { item_id: v ?? id, quantity: qty });
    const suma = Math.max(1, Math.floor(qty));
    setItems((p) => p.some((i) => same(i, id, v))
      ? p.map((i) => same(i, id, v) ? { ...i, qty: Math.min(tope, i.qty + suma) } : i)
      : [...p, { productId: id, variantId: v, qty: Math.min(tope, suma) }]);
  };
  const setQty = (id: number, qty: number, v?: number | null, max = MAX_CANTIDAD) => setItems((p) => p.map((i) => {
    if (!same(i, id, v)) return i;
    const tope = Math.max(1, Math.min(MAX_CANTIDAD, Math.floor(max)));
    return { ...i, qty: Math.max(1, Math.min(tope, Math.floor(qty))) };
  }));
  const remove = (id: number, v?: number | null) => setItems((p) => p.filter((i) => !same(i, id, v)));
  return <C.Provider value={{ items, count: items.reduce((s, i) => s + i.qty, 0), add, setQty, remove, clear: () => setItems([]), ttlHoras: horas, expiresAt: savedAt ? savedAt + ttlMs : null, ready, aviso }}>{children}</C.Provider>;
}
