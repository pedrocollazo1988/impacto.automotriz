"use client";
import { useState } from "react";
import { PageHeader, PanelPad, Badge } from "@/components/admin/ui";
import { usePreferences } from "@/components/site/Preferences";

export default function Importar() {
  const { t } = usePreferences();
  const [res, setRes] = useState<{ created: number; updated: number; errors: { fila: number; error: string }[] } | null>(null); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const upload = async (file: File) => {
    setBusy(true); setErr(""); setRes(null);
    const r = await fetch("/api/admin/products/import", { method: "POST", headers: { "x-filename": file.name }, body: await file.arrayBuffer() }); const j = await r.json(); setBusy(false);
    r.ok ? setRes(j) : setErr(j.error ?? t("adm.prod.importFailed"));
  };
  return (
    <>
      <PageHeader title={t("adm.prod.importTitle")} subtitle={t("adm.prod.importSubtitle")} />
      <PanelPad className="space-y-4">
        <ol className="list-decimal space-y-1 pl-5 text-sm text-slate-700"><li>{t("adm.prod.importStep1Lead")} <a className="link-underline font-semibold text-navy" href="/plantilla-productos.csv" download>{t("adm.prod.importTemplate")}</a> {t("adm.prod.importStep1Tail")}</li><li>{t("adm.prod.importStep2")}</li><li>{t("adm.prod.importStep3Lead")} <b>.xlsx</b> {t("adm.prod.importStep3Mid")} <b>CSV UTF-8</b> {t("adm.prod.importStep3Tail")}</li></ol>
        <p className="text-xs text-slate-500">{t("adm.prod.importNotes")}</p>
        <label className="flex w-fit cursor-pointer items-center gap-2 rounded-xl border border-dashed border-slate-300 px-4 py-3 text-sm font-medium text-navy hover:border-[color:var(--color-action)] hover:bg-slate-50">
          <input type="file" className="hidden" accept=".csv,.xlsx,text/csv,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet" disabled={busy} onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])} />
          {busy ? t("adm.prod.importing") : t("adm.prod.selectFile")}
        </label>
        {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
        {res && <div className="space-y-1 rounded-xl border p-3 text-sm"><p className="flex flex-wrap items-center gap-2"><Badge tone="ok">{t("adm.prod.created").replace("{n}", String(res.created))}</Badge><Badge tone="info">{t("adm.prod.updated").replace("{n}", String(res.updated))}</Badge>{res.errors.length > 0 && <Badge tone="danger">{t("adm.prod.withError").replace("{n}", String(res.errors.length))}</Badge>}</p>{res.errors.map((e) => <p key={e.fila} className="text-red-600">{t("adm.prod.row").replace("{n}", String(e.fila))} {e.error}</p>)}</div>}
      </PanelPad>
    </>);
}
