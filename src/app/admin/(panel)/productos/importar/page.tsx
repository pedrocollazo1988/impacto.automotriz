"use client";
import { useState } from "react";
import { PageHeader, PanelPad, Badge } from "@/components/admin/ui";

export default function Importar() {
  const [res, setRes] = useState<{ created: number; updated: number; errors: { fila: number; error: string }[] } | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true); setErr(""); setRes(null);
    const r = await fetch("/api/admin/products/import", { method: "POST", headers: { "x-filename": file.name }, body: await file.arrayBuffer() }); const j = await r.json(); setBusy(false);
    r.ok ? setRes(j) : setErr(j.error ?? "No se pudo importar");
  };
  return (
    <>
      <PageHeader title="Carga masiva de productos" subtitle="Sube tu catálogo desde Excel o CSV" />
      <PanelPad className="space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700"><li>Descarga la <a className="link-underline font-semibold text-navy" href="/plantilla-productos.csv" download>plantilla</a> y ábrela en Excel.</li><li>Rellena una fila por producto (si el código ya existe, se actualiza).</li><li>Súbelo aquí como <b>.xlsx</b> (primera hoja) o <b>CSV UTF-8</b> (máximo 1000 filas).</li></ol>
        <p className="text-xs text-slate-500">Fotos: varias URL separadas por «|». Compatibilidad: Marca:Modelo:desde:hasta, separadas por «|». Especificaciones: Clave: valor, separadas por «|».</p>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-navy hover:border-[color:var(--color-accent)] hover:bg-slate-50">
          <input type="file" className="hidden" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {busy ? "Importando…" : "Seleccionar archivo (.xlsx o .csv)"}
        </label>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        {res && <div className="space-y-1 rounded-xl border p-3 text-sm"><p className="flex flex-wrap items-center gap-2"><Badge tone="ok">{res.created} creados</Badge><Badge tone="info">{res.updated} actualizados</Badge>{res.errors.length > 0 && <Badge tone="danger">{res.errors.length} con error</Badge>}</p>{res.errors.map((e) => <p key={e.fila} className="text-red-600">Fila {e.fila}: {e.error}</p>)}</div>}
      </PanelPad>
    </>);
}
