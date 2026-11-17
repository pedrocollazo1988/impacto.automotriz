"use client";
import { useEffect, useState } from "react";
const KEY = "compare";
const read = (): number[] => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter(Number.isInteger).slice(0, 4) : []; } catch { return []; } };
export default function CompareToggle({ productId }: { productId: number }) {
  const [on, setOn] = useState(false); const [n, setN] = useState(0);
  useEffect(() => { const l = read(); setOn(l.includes(productId)); setN(l.length); }, [productId]);
  const toggle = () => {
    let l = read();
    if (l.includes(productId)) l = l.filter((x) => x !== productId);
    else { if (l.length >= 4) return alert("Puedes comparar hasta 4 productos"); l = [...l, productId]; }
    localStorage.setItem(KEY, JSON.stringify(l)); setOn(l.includes(productId)); setN(l.length);
  };
  return <span className="inline-flex items-center gap-3"><button className="rounded-lg border px-4 py-2 text-sm" onClick={toggle}>{on ? "✓ En comparación" : "⇄ Comparar"}</button>{n > 0 && <a href="/comparar" className="text-sm text-navy underline">Ver comparación ({n})</a>}</span>;
}
