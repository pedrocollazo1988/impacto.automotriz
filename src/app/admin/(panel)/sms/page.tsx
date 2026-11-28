"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, PanelPad, Badge, inputCls } from "@/components/admin/ui";
import Icon from "@/components/brand/Icon";

type Estado = { proveedor: string; real: boolean; listo: boolean; faltan: string[] };

export default function Sms() {
  const [estado, setEstado] = useState<Estado | null>(null);
  const [telefono, setTelefono] = useState("");
  const [aviso, setAviso] = useState(""); const [error, setError] = useState(""); const [busy, setBusy] = useState(false);

  const cargar = useCallback(() => { fetch("/api/admin/sms").then((r) => r.json()).then(setEstado).catch(() => setEstado(null)); }, []);
  useEffect(cargar, [cargar]);

  const probar = async () => {
    setBusy(true); setAviso(""); setError("");
    const r = await fetch("/api/admin/sms", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ telefono }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) {
      if (j.error === "AUTH_PHONE_INVALID") return setError("Escribe el número con código de país, por ejemplo +5355551234.");
      if (j.error === "sms_sin_configurar") return setError(`Falta configurar el proveedor. Variables pendientes: ${(j.faltan ?? []).join(", ") || "SMS_PROVIDER"}.`);
      return setError(`No se pudo enviar (${j.error ?? "error desconocido"}). Revisa las credenciales en Vercel.`);
    }
    setAviso(`Enviado con ${j.proveedor}. Revisa el teléfono en unos segundos.`);
  };

  return (
    <>
      <PageHeader title="SMS de verificación" subtitle="Comprueba que los códigos de acceso llegan de verdad al teléfono" />
      <Panel className="mb-4">
        <PanelPad>
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="mobile" size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">
                Proveedor: <span className="font-mono text-xs">{estado?.proveedor ?? "…"}</span>{" "}
                {estado && <Badge tone={estado.listo ? "ok" : estado.real ? "warn" : "mute"}>{estado.listo ? "Listo" : estado.real ? "Incompleto" : "Modo prueba"}</Badge>}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {estado?.listo
                  ? "Las credenciales están completas: los códigos salen por SMS real."
                  : estado?.real
                    ? `Faltan variables de entorno: ${estado.faltan.join(", ")}.`
                    : "Sin credenciales el código se imprime en los logs del servidor y no se envía nada. Define SMS_PROVIDER y sus claves en Vercel."}
              </p>
            </div>
            <button className="btn btn-ghost" onClick={cargar}><Icon name="refresh" size={14} /> Actualizar</button>
          </div>
        </PanelPad>
      </Panel>

      <Panel>
        <PanelPad>
          <p className="text-sm font-semibold text-slate-800">Enviar mensaje de prueba</p>
          <p className="mt-1 text-xs text-slate-500">No gasta códigos de acceso ni afecta a ninguna cuenta: es un mensaje de configuración.</p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="space-y-1">
              <span className="block text-xs font-semibold text-slate-600">Teléfono con código de país</span>
              <input className={`${inputCls} w-56`} placeholder="+5355551234" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </label>
            <button className="btn btn-primary disabled:opacity-50" disabled={busy || telefono.trim().length < 4} onClick={probar}>
              <Icon name="send" size={14} /> {busy ? "Enviando…" : "Enviar prueba"}
            </button>
          </div>
          {aviso && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{aviso}</p>}
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </PanelPad>
      </Panel>
    </>
  );
}
