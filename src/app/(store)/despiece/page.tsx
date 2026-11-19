import Link from "next/link";
import type { Metadata } from "next";
import { getVehicles, getVehicle } from "@/lib/despiece";
import Icon from "@/components/brand/Icon";
import VehiclePicker from "@/components/despiece/VehiclePicker";
export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Despiece de vehículos",
  description: "Diagramas interactivos por sistema con SKU, especificaciones y compra directa de cada pieza.",
};

export default async function DespieceIndex() {
  const vehicles = await getVehicles();

  if (vehicles.length === 0) {
    return (
      <div className="container-x py-16">
        <div className="adm-empty">
          <Icon name="layers" size={40} />
          <h1 className="font-display text-2xl font-extrabold text-navy">Aún no hay despieces publicados</h1>
          <p className="text-sm">Estamos cargando los diagramas de los primeros modelos.</p>
          <Link href="/catalogo" className="btn btn-primary mt-3">Ver catálogo</Link>
        </div>
      </div>
    );
  }

  const details = await Promise.all(vehicles.map((v) => getVehicle(v.slug)));

  return (
    <div className="container-x py-10">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow text-[color:var(--color-accent-deep)]">Despiece interactivo</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-navy sm:text-4xl">Encuentra la pieza exacta</h1>
        <p className="mt-2 text-slate-600">
          Elige tu vehículo y navega por sistemas. Cada número del dibujo abre la ficha de la pieza con su
          código, sus medidas y el botón de compra, sin riesgo de confundir la versión.
        </p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {vehicles.map((v, i) => {
          const d = details[i];
          const piezas = d?.diagrams.reduce((s, x) => s + x.pins.length, 0) ?? 0;
          return (
            <article key={v.id} className="adm-panel">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400">{v.brand}</p>
                  <h2 className="font-display text-2xl font-extrabold text-navy">{v.model}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{v.version} · {v.voltage} · {v.power}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-extrabold text-navy">{piezas}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-400">piezas</p>
                </div>
              </div>
              {v.summary && <p className="border-b border-slate-100 p-4 text-sm leading-relaxed text-slate-600">{v.summary}</p>}
              <ul className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3">
                {(d?.diagrams ?? []).map((dg) => (
                  <li key={dg.id}>
                    <Link href={`/despiece/${v.slug}/${dg.system.slug}`} className="flex h-full flex-col gap-1 bg-white p-3 transition hover:bg-slate-50">
                      <Icon name={dg.system.icon} size={16} className="text-[color:var(--color-accent)]" />
                      <span className="text-xs font-bold leading-tight text-navy">{dg.system.name}</span>
                      <span className="font-mono text-[10px] text-slate-400">{dg.pins.length} piezas</span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-3">
                <VehiclePicker vehicle={{ slug: v.slug, brand: v.brand, model: v.model, version: v.version }} />
                <Link href={`/despiece/${v.slug}`} className="btn btn-primary btn-sm">
                  Ver despiece <Icon name="arrowRight" size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
