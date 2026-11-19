"use client";
import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type MiVehiculo = { slug: string; brand: string; model: string; version: string };

type Ctx = {
  vehicle: MiVehiculo | null;
  setVehicle: (v: MiVehiculo | null) => void;
  ready: boolean;
};

const C = createContext<Ctx | null>(null);
export const useVehicle = () => {
  const c = useContext(C);
  if (!c) throw new Error("VehicleProvider ausente");
  return c;
};

const KEY = "mi-vehiculo";

export function VehicleProvider({ children }: { children: ReactNode }) {
  const [vehicle, setState] = useState<MiVehiculo | null>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    try {
      const raw = localStorage.getItem(KEY);
      if (raw) {
        const v = JSON.parse(raw);
        if (v && typeof v.slug === "string" && typeof v.model === "string") setState(v);
      }
    } catch {}
    setReady(true);
  }, []);

  const setVehicle = (v: MiVehiculo | null) => {
    setState(v);
    try {
      if (v) localStorage.setItem(KEY, JSON.stringify(v));
      else localStorage.removeItem(KEY);
    } catch {}
  };

  return <C.Provider value={{ vehicle, setVehicle, ready }}>{children}</C.Provider>;
}
