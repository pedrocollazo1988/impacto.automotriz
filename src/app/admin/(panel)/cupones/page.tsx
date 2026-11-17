"use client";
import { useCallback, useEffect, useState } from "react";

type C = { id: number; code: string; percentOff: number | null; amountOffUsd: string | null; minSubtotalUsd: string | null; maxUses: number | null; used: number; expiresAt: string | null; active: boolean };
export default function Cupones() {
  const [list, setList] = useState<C[]>([]); const [f, setF] = useState({ code: "", kind: "percent", value: "", min: "", maxUses: "", expiresAt: "" }); const [err, setErr] = useState("");
  const load = useCallback(() => { fetch("/api/admin/coupons").then((r) => r.json()).then(setList); }, []); useEffect(load, [load]);
  const create = async () => {
    const v = Number(f.value);
    const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: f.code, percentOff: f.kind === "percent" ? v : null, amountOffUsd: f.kind === "amount" ? v : null, minSubtotalUsd: f.min ? Number(f.min) : null, maxUses: f.maxUses ? Number(f.maxUses) : null, expiresAt: f.expiresAt || null }) });
    const j = await r.json(); if (!r.ok) return setErr(j.error ?? "Revisa los datos"); setErr(""); setF({ code: "", kind: "percent", value: "", min: "", maxUses: "", expiresAt: "" }); load();
  };
  const i = "rounded border px-3 py-2 text-sm";
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6"><h1 className="text-2xl font-bold text-navy">Cupones y promociones</h1>
      <div className="flex flex-wrap gap-2"><input className={i} placeholder="CÓDIGO" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} />
        <select className={i} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="percent">% de descuento</option><option value="amount">Monto fijo USD</option></select>
        <input className={`${i} w-24`} type="number" placeholder="Valor" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} />
        <input className={`${i} w-32`} type="number" placeholder="Compra mín." value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} />
        <input className={`${i} w-28`} type="number" placeholder="Usos máx." value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} />
        <input className={i} type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} />
        <button className="rounded bg-navy px-4 py-2 text-sm text-white" onClick={create}>Crear</button></div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th>Código</th><th>Descuento</th><th>Mínimo</th><th>Usos</th><th>Vence</th><th /></tr></thead>
        <tbody>{list.map((c) => <tr key={c.id} className={`border-t ${c.active ? "" : "text-slate-400"}`}><td className="py-2 font-mono">{c.code}</td><td>{c.percentOff ? `${c.percentOff}%` : `${Number(c.amountOffUsd).toFixed(2)} USD`}</td><td>{c.minSubtotalUsd ?? "—"}</td><td>{c.used}{c.maxUses ? `/${c.maxUses}` : ""}</td><td>{c.expiresAt?.slice(0, 10) ?? "—"}</td>
          <td>{c.active && <button className="text-red-600" onClick={async () => { await fetch(`/api/admin/coupons?id=${c.id}`, { method: "DELETE" }); load(); }}>Desactivar</button>}</td></tr>)}</tbody></table></main>);
}
