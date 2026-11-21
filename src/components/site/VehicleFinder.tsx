"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";

const MAKES = ["Toyota", "Hyundai", "Kia", "Nissan", "Chevrolet", "Peugeot", "Renault", "Fiat", "Suzuki", "Mitsubishi", "Volkswagen", "Ford"];
const YEARS = Array.from({ length: 30 }, (_, i) => new Date().getFullYear() - i);

// Buscador por vehículo del hero: marca, modelo y año → /catalogo con filtros de compatibilidad.
export default function VehicleFinder() {
  const router = useRouter();
  const [make, setMake] = useState(""); const [model, setModel] = useState(""); const [year, setYear] = useState("");
  const go = () => {
    const p = new URLSearchParams();
    if (make) p.set("make", make); if (model) p.set("model", model); if (year) p.set("year", year);
    router.push(`/catalogo?${p.toString()}`);
  };
  return (
    <div className="card relative overflow-hidden p-5 sm:p-6">
      <div aria-hidden className="absolute -right-10 -top-10 h-32 w-32 rounded-full bg-[color:var(--color-accent)]/10 blur-2xl" />
      <div className="relative">
        <div className="flex items-center gap-2">
          <span className="grid h-9 w-9 place-items-center rounded-lg bg-[color:var(--color-navy)]/8 text-[color:var(--color-accent-deep)]"><Icon name="car" size={18} /></span>
          <div>
            <p className="font-display text-sm font-bold text-navy">Encuentra piezas para tu vehículo</p>
            <p className="text-xs text-slate-500">Filtramos por compatibilidad real</p>
          </div>
        </div>
        <div className="mt-4 space-y-3">
          <div>
            <label htmlFor="vf-marca" className="eyebrow !text-[10px] text-slate-500">Marca</label>
            <select id="vf-marca" className="input-select mt-1" value={make} onChange={(e) => setMake(e.target.value)}>
              <option value="">Cualquier marca…</option>
              {MAKES.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
          </div>
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label htmlFor="vf-modelo" className="eyebrow !text-[10px] text-slate-500">Modelo</label>
              <input id="vf-modelo" className="input mt-1" placeholder="Corolla…" value={model} onChange={(e) => setModel(e.target.value)} />
            </div>
            <div>
              <label htmlFor="vf-anio" className="eyebrow !text-[10px] text-slate-500">Año</label>
              <select id="vf-anio" className="input-select mt-1" value={year} onChange={(e) => setYear(e.target.value)}>
                <option value="">—</option>
                {YEARS.map((y) => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
          </div>
          <button onClick={go} className="btn btn-primary w-full"><Icon name="search" size={18} /> Buscar piezas compatibles</button>
        </div>
      </div>
    </div>
  );
}
