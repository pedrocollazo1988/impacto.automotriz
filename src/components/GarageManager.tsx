"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

type V = { id: number; make: string; model: string; year: number; alias: string | null };
export default function GarageManager({ vehicles }: { vehicles: V[] }) {
  const router = useRouter(); const [f, setF] = useState({ make: "", model: "", year: "" }); const [err, setErr] = useState("");
  const add = async () => {
    const r = await fetch("/api/account/garage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ make: f.make, model: f.model, year: Number(f.year) }) });
    if (!r.ok) return setErr((await r.json()).error ?? "Revisa los datos"); setF({ make: "", model: "", year: "" }); setErr(""); router.refresh();
  };
  const i = "rounded border px-3 py-2 text-sm";
  return (
    <div className="space-y-3">
      {vehicles.map((v) => (
        <div key={v.id} className="flex items-center justify-between rounded border p-3 text-sm">
          <span><b>{v.make} {v.model}</b> ({v.year})</span>
          <span className="space-x-3"><Link className="text-navy underline" href={`/catalogo?make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}&year=${v.year}`}>Ver piezas compatibles</Link>
            <button className="text-red-600" onClick={async () => { await fetch(`/api/account/garage?id=${v.id}`, { method: "DELETE" }); router.refresh(); }}>Quitar</button></span>
        </div>))}
      <div className="flex flex-wrap gap-2"><input className={i} placeholder="Marca" value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} /><input className={i} placeholder="Modelo" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} /><input className={`${i} w-24`} type="number" placeholder="Año" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} /><button className="rounded bg-navy px-4 py-2 text-sm text-white" onClick={add}>Añadir vehículo</button></div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>);
}
