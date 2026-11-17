"use client";
import { useState } from "react";

export default function Importar() {
  const [res, setRes] = useState<{ created: number; updated: number; errors: { fila: number; error: string }[] } | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true); setErr(""); setRes(null);
    const r = await fetch("/api/admin/products/import", { method: "POST", headers: { "x-filename": file.name }, body: await file.arrayBuffer() }); const j = await r.json(); setBusy(false);
    r.ok ? setRes(j) : setErr(j.error ?? "No se pudo importar");
  };
  return (
    <main className="mx-auto max-w-3xl space-y-4 p-6"><h1 className="text-2xl font-bold text-navy">Carga masiva de productos</h1>
      <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700"><li>Descarga la <a className="text-navy underline" href="/plantilla-productos.csv" download>plantilla</a> y ábrela en Excel.</li><li>Rellena una fila por producto (si el código ya existe, se actualiza).</li><li>Súbelo aquí como <b>.xlsx</b> (primera hoja) o <b>CSV UTF-8</b> (máximo 1000 filas).</li></ol>
      <p className="text-xs text-slate-500">Fotos: varias URL separadas por «|». Compatibilidad: Marca:Modelo:desde:hasta, separadas por «|».</p>
      <input type="file" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
      {busy && <p>Importando…</p>}{err && <p className="text-red-600">{err}</p>}
      {res && <div className="space-y-1 rounded border p-3 text-sm"><p>✔ {res.created} creados · {res.updated} actualizados · {res.errors.length} con error</p>{res.errors.map((e) => <p key={e.fila} className="text-red-600">Fila {e.fila}: {e.error}</p>)}</div>}
    </main>);
}
