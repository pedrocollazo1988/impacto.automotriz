"use client";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { useVehicle, type MiVehiculo } from "@/components/VehicleProvider";

// Barra compacta que recuerda el vehículo del cliente en todo el sitio.
export default function MiVehiculoBar({ vehicles }: { vehicles: MiVehiculo[] }) {
  const { vehicle, setVehicle, ready } = useVehicle();
  if (!ready || vehicles.length === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-slate-50/80">
      <div className="container-x flex flex-wrap items-center gap-2 py-1.5 text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-slate-500">
          <Icon name="car" size={13} /> Mi vehículo:
        </span>
        <select
          value={vehicle?.slug ?? ""}
          onChange={(e) => {
            const v = vehicles.find((x) => x.slug === e.target.value) ?? null;
            setVehicle(v);
          }}
          aria-label="Elegir mi vehículo"
          className="min-h-12 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-navy outline-none focus:border-[color:var(--color-action)] lg:min-h-0 lg:py-1"
        >
          <option value="">Sin seleccionar</option>
          {vehicles.map((v) => (
            <option key={v.slug} value={v.slug}>{v.brand} {v.model} · {v.version}</option>
          ))}
        </select>
        {vehicle ? (
          <>
            <span className="hidden items-center gap-1 font-semibold text-emerald-700 sm:flex">
              <Icon name="check" size={12} /> Verás la compatibilidad marcada
            </span>
            <Link href={`/despiece/${vehicle.slug}`} className="font-semibold text-[color:var(--color-action-deep)] hover:underline">
              Ir a mi despiece
            </Link>
            <button onClick={() => setVehicle(null)} className="ml-auto text-slate-400 hover:text-slate-600" aria-label="Quitar mi vehículo">
              <Icon name="close" size={13} />
            </button>
          </>
        ) : (
          <span className="text-slate-500">Elígelo una vez y te lo recordamos.</span>
        )}
      </div>
    </div>
  );
}
