"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, PanelPad, EmptyState, Badge, inputCls } from "@/components/admin/ui";

type C = { id: number; code: string; percentOff: number | null; amountOffUsd: string | null; minSubtotalUsd: string | null; maxUses: number | null; used: number; expiresAt: string | null; active: boolean };
export default function Cupones() {
  const [list, setList] = useState<C[]>([]); const [f, setF] = useState({ code: "", kind: "percent", value: "", min: "", maxUses: "", expiresAt: "" }); const [err, setErr] = useState("");
  const load = useCallback(() => { fetch("/api/admin/coupons").then((r) => r.json()).then(setList); }, []); useEffect(load, [load]);
  const create = async () => {
    const v = Number(f.value);
    const r = await fetch("/api/admin/coupons", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code: f.code, percentOff: f.kind === "percent" ? v : null, amountOffUsd: f.kind === "amount" ? v : null, minSubtotalUsd: f.min ? Number(f.min) : null, maxUses: f.maxUses ? Number(f.maxUses) : null, expiresAt: f.expiresAt || null }) });
    const j = await r.json(); if (!r.ok) return setErr(j.error ?? "Revisa los datos"); setErr(""); setF({ code: "", kind: "percent", value: "", min: "", maxUses: "", expiresAt: "" }); load();
  };
  return (
    <>
      <PageHeader title="Cupones y promociones" subtitle="Crea códigos de descuento por porcentaje o monto fijo" />
      <PanelPad className="mb-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Código</span><input className={`${inputCls} w-40 font-mono uppercase`} placeholder="VERANO10" value={f.code} onChange={(e) => setF({ ...f, code: e.target.value })} /></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Tipo</span><select className={inputCls} value={f.kind} onChange={(e) => setF({ ...f, kind: e.target.value })}><option value="percent">% de descuento</option><option value="amount">Monto fijo USD</option></select></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Valor</span><input className={`${inputCls} w-24`} type="number" placeholder="10" value={f.value} onChange={(e) => setF({ ...f, value: e.target.value })} /></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Compra mín.</span><input className={`${inputCls} w-28`} type="number" placeholder="0" value={f.min} onChange={(e) => setF({ ...f, min: e.target.value })} /></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Usos máx.</span><input className={`${inputCls} w-24`} type="number" placeholder="∞" value={f.maxUses} onChange={(e) => setF({ ...f, maxUses: e.target.value })} /></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Vence</span><input className={inputCls} type="date" value={f.expiresAt} onChange={(e) => setF({ ...f, expiresAt: e.target.value })} /></label>
          <button className="btn btn-primary" onClick={create}>Crear cupón</button>
        </div>
        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      </PanelPad>
      <Panel>
        {!list.length ? <EmptyState icon="tag" title="Sin cupones" hint="Crea tu primer código de descuento arriba." /> : (
          <div className="adm-scroll">
            <table className="adm-table"><thead><tr><th>Código</th><th>Descuento</th><th>Mínimo</th><th>Usos</th><th>Vence</th><th /></tr></thead>
              <tbody>{list.map((c) => <tr key={c.id} className={c.active ? "" : "text-slate-400"}><td className="font-mono text-xs font-semibold">{c.code}</td><td>{c.percentOff ? `${c.percentOff}%` : `${Number(c.amountOffUsd).toFixed(2)} USD`}</td><td className="text-slate-500">{c.minSubtotalUsd ?? "—"}</td><td>{c.used}{c.maxUses ? `/${c.maxUses}` : ""}</td><td className="text-slate-500">{c.expiresAt?.slice(0, 10) ?? "—"}</td>
                <td className="text-right">{c.active ? <button className="btn btn-danger btn-xs" onClick={async () => { await fetch(`/api/admin/coupons?id=${c.id}`, { method: "DELETE" }); load(); }}>Desactivar</button> : <Badge tone="mute">Inactivo</Badge>}</td></tr>)}</tbody></table>
          </div>
        )}
      </Panel>
    </>);
}
