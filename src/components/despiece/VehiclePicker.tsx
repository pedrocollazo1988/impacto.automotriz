"use client";
import Icon from "@/components/brand/Icon";
import { useVehicle, type MiVehiculo } from "@/components/VehicleProvider";
import { usePreferences } from "@/components/site/Preferences";

export default function VehiclePicker({ vehicle }: { vehicle: MiVehiculo }) {
  const { t } = usePreferences();
  const { vehicle: actual, setVehicle } = useVehicle();
  const esMio = actual?.slug === vehicle.slug;
  return (
    <button
      onClick={() => setVehicle(esMio ? null : vehicle)}
      className={`btn btn-xs ${esMio ? "btn-ghost text-emerald-700" : "btn-ghost"}`}
      aria-pressed={esMio}
    >
      <Icon name={esMio ? "check" : "car"} size={13} />
      {t("parts.myVehicle")}
    </button>
  );
}
