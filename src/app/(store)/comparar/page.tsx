"use client";
import { useEffect, useState } from "react";
import Link from "next/link";

type P = { id: number; slug: string; name: string; priceUsd: number; inStock: boolean; brand: string | null; category: string; specs: Record<string, string>; fits: string[] };
export default function Comparar() {
  const [ps, setPs] = useState<P[] | null>(null);
  useEffect(() => {
    let ids: number[] = []; try { ids = JSON.parse(localStorage.getItem("compare") ?? "[]"); } catch {}
    if (!ids.length) return setPs([]);
    fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }).then((r) => r.json()).then((d) => setPs(Array.isArray(d) ? d : []));
  }, []);
  const remove = (id: number) => { const l = (JSON.parse(localStorage.getItem("compare") ?? "[]") as number[]).filter((x) => x !== id); localStorage.setItem("compare", JSON.stringify(l)); setPs((p) => p?.filter((x) => x.id !== id) ?? []); };
  if (ps === null) return <p>Cargando…</p>;
  if (!ps.length) return <p>No hay productos para comparar. Usa el botón «Comparar» en la ficha de cada producto. <Link className="text-navy underline" href="/catalogo">Ver catálogo</Link></p>;
  const keys = [...new Set(ps.flatMap((p) => Object.keys(p.specs)))];
  const row = (label: string, f: (p: P) => React.ReactNode) => <tr className="border-t"><th className="py-2 pr-3 text-left font-medium text-slate-600">{label}</th>{ps.map((p) => <td key={p.id} className="py-2 pr-3 align-top">{f(p)}</td>)}</tr>;
  return (
    <div className="space-y-4 overflow-x-auto"><h1 className="text-2xl font-bold text-navy">Comparar productos</h1>
      <table className="w-full min-w-[640px] text-sm"><tbody>
        {row("Producto", (p) => <><Link className="font-semibold text-navy underline" href={`/producto/${p.slug}`}>{p.name}</Link><br /><button className="text-xs text-red-600" onClick={() => remove(p.id)}>Quitar</button></>)}
        {row("Precio", (p) => <b>{p.priceUsd.toFixed(2)} USD</b>)}{row("Marca", (p) => p.brand ?? "—")}{row("Categoría", (p) => p.category)}
        {row("Disponibilidad", (p) => (p.inStock ? "Disponible" : "Agotado"))}
        {keys.map((k) => row(k, (p) => p.specs[k] ?? "—"))}
        {row("Compatible con", (p) => (p.fits.length ? p.fits.map((f) => <div key={f}>{f}</div>) : "—"))}
      </tbody></table></div>);
}
