"use client";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { useVehicle, type MiVehiculo } from "@/components/VehicleProvider";
import { usePreferences } from "@/components/site/Preferences";

// Barra compacta que recuerda el vehículo del cliente en todo el sitio.
export default function MiVehiculoBar({ vehicles }: { vehicles: MiVehiculo[] }) {
  const { vehicle, setVehicle } = useVehicle();
  const { t } = usePreferences();
  // La barra se pinta desde el servidor con el mismo alto que tendrá luego: si
  // esperase a leer localStorage para aparecer, empujaría la página 42 px y
  // todo lo de abajo contaría como CLS en cada visita.
  if (vehicles.length === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-slate-50/80 print:hidden">
      <div className="container-x flex flex-wrap items-center gap-2 py-1.5 text-xs">
        <span className="flex items-center gap-1.5 font-semibold text-slate-500">
          <Icon name="car" size={13} /> {t("vehicleBar.label")}
        </span>
        <select
          value={vehicle?.slug ?? ""}
          onChange={(e) => {
            const v = vehicles.find((x) => x.slug === e.target.value) ?? null;
            setVehicle(v);
          }}
          aria-label={t("vehicleBar.choose")}
          className="min-h-12 rounded-lg border border-slate-200 bg-white px-2 text-xs font-semibold text-navy outline-none focus:border-[color:var(--color-action)] lg:min-h-0 lg:py-1"
        >
          <option value="">{t("vehicleBar.none")}</option>
          {vehicles.map((v) => (
            <option key={v.slug} value={v.slug}>{v.brand} {v.model} · {v.version}</option>
          ))}
        </select>
        {vehicle ? (
          <>
            <span className="hidden items-center gap-1 font-semibold text-emerald-700 sm:flex">
              <Icon name="check" size={12} /> {t("vehicleBar.compat")}
            </span>
            {/* Oculto en móvil: el desplegable ya lleva al vehículo y así la
                fila no gana una segunda línea cuando se elige uno. */}
            <Link href={`/despiece/${vehicle.slug}`} className="hidden font-semibold text-[color:var(--color-action-deep)] hover:underline sm:inline">
              {t("vehicleBar.diagram")}
            </Link>
            <button onClick={() => setVehicle(null)} className="ml-auto text-slate-400 hover:text-slate-600" aria-label={t("vehicleBar.remove")}>
              <Icon name="close" size={13} />
            </button>
          </>
        ) : (
          <span className="hidden text-slate-500 sm:inline">{t("vehicleBar.hint")}</span>
        )}
      </div>
    </div>
  );
}
