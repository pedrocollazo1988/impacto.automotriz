"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/brand/Icon";

type V = { id: number; make: string; model: string; year: number; alias: string | null };
export default function GarageManager({ vehicles }: { vehicles: V[] }) {
  const router = useRouter(); const [f, setF] = useState({ make: "", model: "", year: "" }); const [err, setErr] = useState("");
  const add = async () => {
    setErr("");
    if (f.make.trim().length < 2) return setErr("Escribe la marca del vehículo.");
    if (f.model.trim().length < 1) return setErr("Escribe el modelo del vehículo.");
    const year = Number(f.year);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) return setErr("Escribe un año válido, entre 1900 y 2100.");
    const r = await fetch("/api/account/garage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ make: f.make, model: f.model, year }) });
    if (!r.ok) return setErr((await r.json()).error ?? "Revisa los datos"); setF({ make: "", model: "", year: "" }); setErr(""); router.refresh();
  };
  return (
    <div className="space-y-4">
      {vehicles.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {vehicles.map((v) => (
            <li key={v.id} className="card flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="car" size={20} /></span>
              <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{v.make} {v.model}</p><p className="text-xs text-slate-400">{v.year}</p></div>
              <Link href={`/catalogo?make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}&year=${v.year}`} className="btn btn-ghost h-9 px-3 text-xs">Ver piezas</Link>
              <button aria-label="Quitar vehículo" className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600" onClick={async () => { await fetch(`/api/account/garage?id=${v.id}`, { method: "DELETE" }); router.refresh(); }}><Icon name="trash" size={16} /></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">Añade tu vehículo para ver solo las piezas compatibles.</p>}
      <div className="flex flex-wrap gap-2">
        <input className="input flex-1 min-w-32" placeholder="Marca" value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} />
        <input className="input flex-1 min-w-32" placeholder="Modelo" value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
        <input className="input w-28" type="number" placeholder="Año" value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
        <button className="btn btn-primary" onClick={add}><Icon name="plus" size={16} /> Añadir</button>
      </div>
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>);
}
