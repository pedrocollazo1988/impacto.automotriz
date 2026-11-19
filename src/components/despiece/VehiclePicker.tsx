"use client";
import Icon from "@/components/brand/Icon";
import { useVehicle, type MiVehiculo } from "@/components/VehicleProvider";

export default function VehiclePicker({ vehicle }: { vehicle: MiVehiculo }) {
  const { vehicle: actual, setVehicle } = useVehicle();
  const esMio = actual?.slug === vehicle.slug;
  return (
    <button
      onClick={() => setVehicle(esMio ? null : vehicle)}
      className={`btn btn-xs ${esMio ? "btn-ghost text-[color:var(--color-ok)]" : "btn-ghost"}`}
      aria-pressed={esMio}
    >
      <Icon name={esMio ? "check" : "car"} size={13} />
      {esMio ? "Es mi vehículo" : "Es mi vehículo"}
    </button>
  );
}
