"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, PanelPad, EmptyState, Badge, Field, inputCls } from "@/components/admin/ui";
import Icon from "@/components/brand/Icon";

type Clave = "TROPIPAY" | "QVAPAY" | "TRANSFER" | "CASH";
type Campo = { campo: string; etiqueta: string; secreto?: boolean; ayuda?: string };
type Gw = {
  key: Clave; name: string; description: string; kind: "online" | "manual"; enabled: boolean; sandbox: boolean;
  sortOrder: number; instructions: string; feePercent: number; minTotalUsd: number | null; maxTotalUsd: number | null;
  creds: Record<string, string>; updatedAt: string;
};

// Los campos de cada pasarela vienen del servidor para no duplicar la lista.
const CAMPOS: Record<Clave, Campo[]> = {
  TROPIPAY: [
    { campo: "clientId", etiqueta: "Client ID" },
    { campo: "clientSecret", etiqueta: "Client Secret", secreto: true },
    { campo: "reasonId", etiqueta: "Reason ID", ayuda: "Motivo del cobro que exige Tropipay (por defecto 4)." },
  ],
  QVAPAY: [
    { campo: "appId", etiqueta: "App ID" },
    { campo: "appSecret", etiqueta: "App Secret", secreto: true },
  ],
  TRANSFER: [
    { campo: "banco", etiqueta: "Banco" },
    { campo: "cuenta", etiqueta: "Número de cuenta" },
    { campo: "titular", etiqueta: "Titular" },
  ],
  CASH: [],
};

export default function Pagos() {
  const [lista, setLista] = useState<Gw[]>([]);
  const [editando, setEditando] = useState<Clave | null>(null);
  const [borrador, setBorrador] = useState<Partial<Gw> & { creds?: Record<string, string> }>({});
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");

  const cargar = useCallback(() => {
    fetch("/api/admin/payments").then((r) => r.json()).then((d) => Array.isArray(d) && setLista(d));
  }, []);
  useEffect(cargar, [cargar]);

  const abrir = (g: Gw) => { setEditando(g.key); setBorrador({ ...g, creds: {} }); setErr(""); setMsg(""); };

  const guardar = async () => {
    if (!editando) return;
    setErr(""); setMsg("");
    const body: Record<string, unknown> = {
      key: editando, name: borrador.name, description: borrador.description, enabled: borrador.enabled,
      sandbox: borrador.sandbox, sortOrder: borrador.sortOrder, instructions: borrador.instructions,
      feePercent: Number(borrador.feePercent ?? 0),
      minTotalUsd: borrador.minTotalUsd === null || borrador.minTotalUsd === undefined ? null : Number(borrador.minTotalUsd),
      maxTotalUsd: borrador.maxTotalUsd === null || borrador.maxTotalUsd === undefined ? null : Number(borrador.maxTotalUsd),
    };
    // Solo se envían las credenciales que el usuario escribió.
    const creds = Object.fromEntries(Object.entries(borrador.creds ?? {}).filter(([, v]) => v.trim()));
    if (Object.keys(creds).length) body.creds = creds;

    const r = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    if (!r.ok) return setErr(j.error ?? "No se pudo guardar");
    setMsg("Guardado"); setEditando(null); cargar();
  };

  const revocar = async (g: Gw) => {
    if (!confirm(`¿Vaciar las credenciales de ${g.name}? La pasarela se desactivará.`)) return;
    await fetch(`/api/admin/payments?key=${g.key}`, { method: "DELETE" });
    cargar();
  };

  const alternar = async (g: Gw) => {
    await fetch("/api/admin/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ key: g.key, enabled: !g.enabled }),
    });
    cargar();
  };

  // Una pasarela activa sin credenciales no sale en el checkout: hay que avisarlo.
  const falta = (g: Gw) => CAMPOS[g.key].filter((c) => c.secreto && !g.creds[c.campo]);

  return (
    <>
      <PageHeader title="Pasarelas de pago" subtitle="Activa los métodos de cobro, guarda las credenciales y define cuándo se ofrecen" />

      {msg && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
      {err && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

      {!lista.length ? (
        <Panel><EmptyState icon="card" title="Sin pasarelas" hint="Recarga la página: se crean solas al abrir esta sección." /></Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-2">
          {lista.map((g) => {
            const faltan = falta(g);
            const aviso = g.enabled && faltan.length > 0;
            return (
              <Panel key={g.key} className={editando === g.key ? "ring-2 ring-[color:var(--color-action)]" : ""}>
                <PanelPad>
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-navy">{g.name}</h3>
                        <Badge tone={g.enabled ? "ok" : "mute"}>{g.enabled ? "Activa" : "Inactiva"}</Badge>
                        <Badge tone="info">{g.kind === "online" ? "Automática" : "Manual"}</Badge>
                        {g.kind === "online" && <Badge tone={g.sandbox ? "warn" : "ok"}>{g.sandbox ? "Pruebas" : "Producción"}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{g.description}</p>
                    </div>
                    <button onClick={() => alternar(g)} className={`btn btn-xs ${g.enabled ? "btn-danger" : "btn-primary"}`}>
                      {g.enabled ? "Desactivar" : "Activar"}
                    </button>
                  </div>

                  {aviso && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <Icon name="info" size={14} />
                      <span>Activa pero no se muestra al comprador: falta {faltan.map((c) => c.etiqueta).join(" y ")}.</span>
                    </p>
                  )}

                  <dl className="mt-3 grid grid-cols-2 gap-x-4 gap-y-1.5 text-xs">
                    <dt className="text-slate-400">Comisión</dt><dd className="text-slate-700">{g.feePercent ? `${g.feePercent} %` : "Sin comisión"}</dd>
                    <dt className="text-slate-400">Importe mínimo</dt><dd className="text-slate-700">{g.minTotalUsd == null ? "Sin mínimo" : `${g.minTotalUsd} USD`}</dd>
                    <dt className="text-slate-400">Importe máximo</dt><dd className="text-slate-700">{g.maxTotalUsd == null ? "Sin máximo" : `${g.maxTotalUsd} USD`}</dd>
                    <dt className="text-slate-400">Credenciales</dt>
                    <dd className="text-slate-700">{CAMPOS[g.key].filter((c) => c.secreto).every((c) => g.creds[c.campo]) ? "Configuradas" : CAMPOS[g.key].some((c) => c.secreto) ? "Incompletas" : "No requiere"}</dd>
                  </dl>

                  <div className="mt-4 flex flex-wrap gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => abrir(g)}><Icon name="wrench" size={14} /> Configurar</button>
                    {g.creds && Object.values(g.creds).some(Boolean) && (
                      <button className="btn btn-danger btn-sm" onClick={() => revocar(g)}><Icon name="trash" size={14} /> Revocar credenciales</button>
                    )}
                  </div>
                </PanelPad>

                {editando === g.key && (
                  <div className="border-t border-slate-200 bg-slate-50/70 p-4">
                    <div className="grid gap-3 sm:grid-cols-2">
                      <Field label="Nombre visible"><input className={inputCls} value={borrador.name ?? ""} onChange={(e) => setBorrador({ ...borrador, name: e.target.value })} /></Field>
                      <Field label="Descripción en el checkout"><input className={inputCls} value={borrador.description ?? ""} onChange={(e) => setBorrador({ ...borrador, description: e.target.value })} /></Field>
                      <Field label="Comisión (%)" hint="Se suma al total que ve el comprador."><input className={inputCls} type="number" step="0.01" min="0" max="30" value={borrador.feePercent ?? 0} onChange={(e) => setBorrador({ ...borrador, feePercent: Number(e.target.value) })} /></Field>
                      <Field label="Orden" hint="Menor número aparece antes."><input className={inputCls} type="number" min="0" max="99" value={borrador.sortOrder ?? 0} onChange={(e) => setBorrador({ ...borrador, sortOrder: Number(e.target.value) })} /></Field>
                      <Field label="Importe mínimo (USD)" hint="Vacío = sin mínimo."><input className={inputCls} type="number" min="0" step="0.01" value={borrador.minTotalUsd ?? ""} onChange={(e) => setBorrador({ ...borrador, minTotalUsd: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
                      <Field label="Importe máximo (USD)" hint="Vacío = sin máximo."><input className={inputCls} type="number" min="0" step="0.01" value={borrador.maxTotalUsd ?? ""} onChange={(e) => setBorrador({ ...borrador, maxTotalUsd: e.target.value === "" ? null : Number(e.target.value) })} /></Field>
                    </div>

                    {CAMPOS[g.key].length > 0 && (
                      <div className="mt-4 grid gap-3 sm:grid-cols-2">
                        {CAMPOS[g.key].map((c) => (
                          <Field key={c.campo} label={c.etiqueta} hint={g.creds[c.campo] ? "Ya hay un valor guardado. Escribe solo si quieres cambiarlo." : c.ayuda ?? "Sin definir."}>
                            <input
                              className={inputCls}
                              type={c.secreto ? "password" : "text"}
                              autoComplete="off"
                              placeholder={g.creds[c.campo] ? (c.secreto ? "••••••••" : "Definido") : ""}
                              value={borrador.creds?.[c.campo] ?? ""}
                              onChange={(e) => setBorrador({ ...borrador, creds: { ...(borrador.creds ?? {}), [c.campo]: e.target.value } })}
                            />
                          </Field>
                        ))}
                      </div>
                    )}

                    <Field label="Instrucciones para el comprador" hint="Se muestran al elegir este método (datos bancarios, notas de entrega…).">
                      <textarea className={inputCls} rows={3} value={borrador.instructions ?? ""} onChange={(e) => setBorrador({ ...borrador, instructions: e.target.value })} />
                    </Field>

                    <div className="mt-4 flex flex-wrap items-center gap-3">
                      <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                        <input type="checkbox" checked={!!borrador.enabled} onChange={(e) => setBorrador({ ...borrador, enabled: e.target.checked })} /> Activa
                      </label>
                      {g.kind === "online" && (
                        <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                          <input type="checkbox" checked={!!borrador.sandbox} onChange={(e) => setBorrador({ ...borrador, sandbox: e.target.checked })} /> Modo pruebas
                        </label>
                      )}
                      <div className="ml-auto flex gap-2">
                        <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
                        <button className="btn btn-primary btn-sm" onClick={guardar}><Icon name="check" size={14} /> Guardar</button>
                      </div>
                    </div>
                  </div>
                )}
              </Panel>
            );
          })}
        </div>
      )}

      <Panel className="mt-6">
        <PanelPad>
          <h3 className="font-display text-sm font-bold text-navy">Cómo funciona el cobro</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li>· Las credenciales se guardan cifradas (AES-256-GCM). Nunca se muestran de vuelta, solo si están puestas.</li>
            <li>· Una pasarela activa sin credenciales no aparece en el checkout; arriba se indica qué falta.</li>
            <li>· Las comisiones se suman al total del comprador y quedan reflejadas en el pedido.</li>
            <li>· Transferencia y efectivo son manuales: el pago se confirma desde Pedidos.</li>
          </ul>
        </PanelPad>
      </Panel>
    </>
  );
}
