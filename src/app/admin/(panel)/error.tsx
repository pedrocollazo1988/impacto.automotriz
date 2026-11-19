"use client";
import { useEffect } from "react";
import Icon from "@/components/brand/Icon";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="adm-panel adm-empty">
      <Icon name="shield" size={34} />
      <p className="font-semibold text-navy">No se pudo cargar esta sección</p>
      <p className="max-w-md text-sm">Ha ocurrido un error al obtener los datos. Vuelve a intentarlo.</p>
      <button className="btn btn-primary btn-sm mt-2" onClick={reset}>Reintentar</button>
    </div>
  );
}
