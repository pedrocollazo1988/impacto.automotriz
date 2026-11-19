"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";

// Genera modelos 3D en lote para los productos que aún no tienen uno.
export default function Bulk3DButton({ missing }: { missing: number }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");
  const run = async () => {
    setBusy(true); setMsg("Generando modelos 3D…");
    try {
      const r = await fetch("/api/admin/products/model3d", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ onlyMissing: true, limit: 100 }) });
      const j = await r.json();
      if (!r.ok) throw new Error(j.error ?? "Error");
      setMsg(`Listo: ${j.ok} de ${j.total} generados${j.failed?.length ? ` · ${j.failed.length} con error` : ""}`);
      router.refresh();
    } catch (e) { setMsg(e instanceof Error ? e.message : "Error"); }
    finally { setBusy(false); }
  };
  return (
    <span className="inline-flex items-center gap-2">
      <button onClick={run} disabled={busy || missing === 0} className="btn btn-ghost btn-sm disabled:opacity-50" title="Crea un modelo 3D a partir de la foto principal de cada producto">
        <Icon name="cube" size={15} /> Generar 3D{missing > 0 ? ` (${missing})` : ""}
      </button>
      {msg && <span className="text-xs text-slate-500">{msg}</span>}
    </span>
  );
}
