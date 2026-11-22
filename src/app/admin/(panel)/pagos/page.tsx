"use client";
import { useCallback, useEffect, useMemo, useState } from "react";
import { PageHeader, Panel, PanelPad, EmptyState, Badge, Field, inputCls, Modal } from "@/components/admin/ui";
import Icon, { NOMBRES_ICONO } from "@/components/brand/Icon";
import PasswordField from "@/components/PasswordField";

type DriverId = "tropipay" | "qvapay" | "manual" | "link";
type Campo = {
  campo: string;
  etiqueta: string;
  tipo?: "text" | "password" | "url" | "textarea" | "number" | "checkbox";
  secreto?: boolean;
  obligatorio?: boolean;
  publico?: boolean;
  ayuda?: string;
  porDefecto?: string;
};
type Driver = { id: DriverId; nombre: string; descripcion: string; kind: "online" | "manual"; icono: string; campos: Campo[] };
type Preset = { id: string; nombre: string; provider: DriverId; icono: string; descripcion: string; config?: Record<string, string> };
type Metodo = {
  id: number;
  key: string;
  provider: DriverId;
  name: string;
  description: string;
  kind: "online" | "manual";
  icon: string;
  enabled: boolean;
  archived: boolean;
  sandbox: boolean;
  sortOrder: number;
  instructions: string;
  feePercent: number;
  minTotalUsd: number | null;
  maxTotalUsd: number | null;
  config: Record<string, string>;
  creds: Record<string, string>;
};

type Formulario = {
  id?: number;
  key?: string;
  provider: DriverId;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  sandbox: boolean;
  sortOrder: number;
  instructions: string;
  feePercent: number;
  minTotalUsd: number | null;
  maxTotalUsd: number | null;
  config: Record<string, string>;
  creds: Record<string, string>;
};

const formularioVacio = (preset?: Preset): Formulario => ({
  provider: preset?.provider ?? "manual",
  name: preset?.nombre ?? "",
  description: preset?.descripcion ?? "",
  icon: preset?.icono ?? "bank",
  enabled: true,
  sandbox: true,
  sortOrder: 0,
  instructions: "",
  feePercent: 0,
  minTotalUsd: null,
  maxTotalUsd: null,
  config: { ...(preset?.config ?? {}) },
  creds: {},
});

export default function Pagos() {
  const [metodos, setMetodos] = useState<Metodo[]>([]);
  const [drivers, setDrivers] = useState<Driver[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [cargando, setCargando] = useState(true);
  const [form, setForm] = useState<Formulario | null>(null);
  const [editando, setEditando] = useState<Metodo | null>(null);
  const [confirmar, setConfirmar] = useState<{ tipo: "archivar" | "revocar"; metodo: Metodo } | null>(null);
  const [msg, setMsg] = useState("");
  const [err, setErr] = useState("");
  const [busy, setBusy] = useState(false);

  const cargar = useCallback(async () => {
    const r = await fetch("/api/admin/payments");
    const j = await r.json().catch(() => ({}));
    if (!r.ok) {
      setErr(j.error ?? "No se pudieron cargar los métodos de pago");
      setCargando(false);
      return;
    }
    setMetodos(Array.isArray(j.methods) ? j.methods : []);
    setDrivers(Array.isArray(j.drivers) ? j.drivers : []);
    setPresets(Array.isArray(j.presets) ? j.presets : []);
    setCargando(false);
  }, []);
  useEffect(() => { cargar(); }, [cargar]);

  const driverDe = (id: DriverId) => drivers.find((d) => d.id === id);
  const driver = form ? driverDe(form.provider) : undefined;
  const campos = driver?.campos ?? [];

  const faltan = (m: Metodo) => {
    const d = driverDe(m.provider);
    return (d?.campos ?? []).filter((c) => {
      if (!c.obligatorio) return false;
      const valor = c.secreto ? m.creds[c.campo] : (m.config[c.campo] ?? m.creds[c.campo]);
      return !valor;
    });
  };

  const secretos = (m: Metodo) => (driverDe(m.provider)?.campos ?? []).filter((c) => c.secreto);
  const credenciales = (m: Metodo) => {
    const s = secretos(m);
    if (!s.length) return "No requiere";
    return s.every((c) => m.creds[c.campo]) ? "Configuradas" : "Incompletas";
  };

  const abrir = (m: Metodo) => {
    setEditando(m);
    setForm({
      id: m.id, key: m.key, provider: m.provider, name: m.name, description: m.description, icon: m.icon,
      enabled: m.enabled, sandbox: m.sandbox, sortOrder: m.sortOrder, instructions: m.instructions,
      feePercent: m.feePercent, minTotalUsd: m.minTotalUsd, maxTotalUsd: m.maxTotalUsd,
      config: { ...m.config }, creds: {},
    });
    setErr(""); setMsg("");
  };

  const nuevo = () => {
    setEditando(null);
    setForm(formularioVacio(presets[0]));
    setErr(""); setMsg("");
  };

  const aplicarPreset = (p: Preset) => {
    setForm((f) => f ? { ...f, provider: p.provider, name: p.nombre, description: p.descripcion, icon: p.icono, config: { ...p.config } } : formularioVacio(p));
  };

  const guardar = async () => {
    if (!form) return;
    setErr(""); setMsg("");
    if (form.name.trim().length < 2) return setErr("Ponle un nombre al método de pago");
    setBusy(true);
    const body: Record<string, unknown> = {
      provider: form.provider,
      name: form.name.trim(),
      description: form.description,
      icon: form.icon,
      enabled: form.enabled,
      sandbox: form.sandbox,
      sortOrder: Number(form.sortOrder) || 0,
      instructions: form.instructions,
      feePercent: Number(form.feePercent) || 0,
      minTotalUsd: form.minTotalUsd === null || Number.isNaN(form.minTotalUsd) ? null : form.minTotalUsd,
      maxTotalUsd: form.maxTotalUsd === null || Number.isNaN(form.maxTotalUsd) ? null : form.maxTotalUsd,
      config: form.config,
      creds: Object.fromEntries(Object.entries(form.creds).filter(([, v]) => v.trim())),
    };
    if (form.id) body.id = form.id;
    const r = await fetch("/api/admin/payments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? "No se pudo guardar");
    setMsg(form.id ? "Cambios guardados" : "Método añadido");
    setForm(null); setEditando(null);
    cargar();
  };

  const alternar = async (m: Metodo) => {
    await fetch("/api/admin/payments", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: m.id, enabled: !m.enabled }),
    });
    cargar();
  };

  const ejecutarConfirmacion = async () => {
    if (!confirmar) return;
    const { tipo, metodo } = confirmar;
    await fetch(`/api/admin/payments?id=${metodo.id}${tipo === "revocar" ? "&mode=creds" : ""}`, { method: "DELETE" });
    setConfirmar(null);
    setMsg(tipo === "revocar" ? "Credenciales revocadas" : "Método archivado");
    cargar();
  };

  const activos = useMemo(() => metodos.filter((m) => m.enabled).length, [metodos]);

  return (
    <>
      <PageHeader
        title="Métodos de pago"
        subtitle="Activa lo que ya usas y añade cualquier forma de cobro nueva"
        actions={<button className="btn btn-primary btn-sm" onClick={nuevo}><Icon name="plus" size={15} /> Añadir método</button>}
      />

      {msg && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
      {err && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

      <PanelPad className="mb-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/10 text-[color:var(--color-action-deep)]">
            <Icon name="wallet" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-navy">Un método para cada cliente</p>
            <p className="mt-0.5 text-sm text-slate-500">
              Transferencia, Zelle, USDT, efectivo o un enlace externo. Los métodos automáticos cobran solos; los manuales se confirman desde Pedidos.
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {activos} {activos === 1 ? "activo" : "activos"} de {metodos.length}
          </div>
        </div>
      </PanelPad>

      {cargando ? (
        <Panel><PanelPad><p className="text-sm text-slate-500">Cargando métodos…</p></PanelPad></Panel>
      ) : !metodos.length ? (
        <Panel><EmptyState icon="card" title="Sin métodos de pago" hint="Añade el primero con el botón de arriba." /></Panel>
      ) : (
        <div className="grid gap-4 xl:grid-cols-2">
          {metodos.map((m) => {
            const d = driverDe(m.provider);
            const pendientes = faltan(m);
            const aviso = m.enabled && pendientes.length > 0;
            return (
              <Panel key={m.id} className="h-full">
                <PanelPad className="flex h-full flex-col">
                  <div className="flex items-start gap-3">
                    <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-navy)]/5 text-navy ring-1 ring-inset ring-[color:var(--color-navy)]/10">
                      <Icon name={m.icon} size={22} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2">
                        <h3 className="font-display text-base font-bold text-navy">{m.name}</h3>
                        <Badge tone={m.enabled ? "ok" : "mute"}>{m.enabled ? "Activo" : "Inactivo"}</Badge>
                        <Badge tone={m.kind === "online" ? "info" : "warn"}>{m.kind === "online" ? "Automático" : "Manual"}</Badge>
                        {m.kind === "online" && <Badge tone={m.sandbox ? "warn" : "ok"}>{m.sandbox ? "Pruebas" : "Producción"}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{m.description || d?.descripcion}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">{d?.nombre ?? m.provider} · {m.key}</p>
                    </div>
                  </div>

                  {aviso && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <Icon name="info" size={14} />
                      <span>Activo pero no se muestra al comprador: falta {pendientes.map((c) => c.etiqueta).join(" y ")}.</span>
                    </p>
                  )}

                  <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                    <div><dt className="text-slate-400">Comisión</dt><dd className="mt-0.5 font-semibold text-slate-700">{m.feePercent ? `${m.feePercent} %` : "Sin comisión"}</dd></div>
                    <div><dt className="text-slate-400">Mínimo</dt><dd className="mt-0.5 font-semibold text-slate-700">{m.minTotalUsd == null ? "—" : `${m.minTotalUsd} USD`}</dd></div>
                    <div><dt className="text-slate-400">Máximo</dt><dd className="mt-0.5 font-semibold text-slate-700">{m.maxTotalUsd == null ? "—" : `${m.maxTotalUsd} USD`}</dd></div>
                    <div className="col-span-3 border-t border-slate-200/70 pt-2"><dt className="inline text-slate-400">Credenciales: </dt><dd className="inline font-semibold text-slate-700">{credenciales(m)}</dd></div>
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => abrir(m)}><Icon name="edit" size={14} /> Editar</button>
                    <button className={`btn btn-sm ${m.enabled ? "btn-ghost" : "btn-primary"}`} onClick={() => alternar(m)}>
                      {m.enabled ? "Desactivar" : "Activar"}
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      {secretos(m).length > 0 && m.creds && Object.values(m.creds).some(Boolean) && (
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmar({ tipo: "revocar", metodo: m })}>Revocar</button>
                      )}
                      <button className="btn btn-quiet btn-sm text-red-600" onClick={() => setConfirmar({ tipo: "archivar", metodo: m })} aria-label={`Archivar ${m.name}`}>
                        <Icon name="trash" size={15} />
                      </button>
                    </div>
                  </div>
                </PanelPad>
              </Panel>
            );
          })}
        </div>
      )}

      <Panel className="mt-6">
        <PanelPad>
          <h3 className="font-display text-sm font-bold text-navy">Cómo se calcula el cobro</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li>· Las credenciales se guardan cifradas (AES-256-GCM). Nunca se muestran de vuelta, solo si están puestas.</li>
            <li>· Un método activo sin lo obligatorio no aparece en el checkout; arriba se indica qué falta.</li>
            <li>· La comisión se suma al total del comprador y queda reflejada en el pedido.</li>
            <li>· Los métodos manuales se confirman desde Pedidos; los automáticos reciben la confirmación de la pasarela.</li>
          </ul>
        </PanelPad>
      </Panel>

      <Modal open={!!form} title={form?.id ? "Editar método de pago" : "Añadir método de pago"} onClose={() => { setForm(null); setEditando(null); }} size="lg">
        {form && (
          <>
            {!form.id && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Empieza con una plantilla</p>
                <div className="mt-2 grid gap-2 sm:grid-cols-2 lg:grid-cols-3">
                  {presets.map((p) => {
                    const activo = form.provider === p.provider && form.name === p.nombre;
                    return (
                      <button
                        key={p.id}
                        type="button"
                        onClick={() => aplicarPreset(p)}
                        className={`flex items-start gap-2 rounded-xl border p-3 text-left transition ${activo ? "border-[color:var(--color-action)] bg-[color:var(--color-action)]/5 ring-2 ring-[color:var(--color-action)]/15" : "border-slate-200 hover:border-slate-300 hover:bg-slate-50"}`}
                      >
                        <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy"><Icon name={p.icono} size={16} /></span>
                        <span className="min-w-0">
                          <span className="block text-xs font-semibold text-slate-800">{p.nombre}</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{p.descripcion}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label="Nombre visible" hint="Es el nombre que verá el comprador.">
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder="Transferencia bancaria" />
              </Field>
              <Field label="Tipo de cobro" hint="Define cómo se confirma el pago.">
                <div className="input flex items-center gap-2 bg-slate-50 text-slate-600">
                  <Icon name={driver?.icono ?? "card"} size={16} />
                  {driver?.nombre ?? form.provider}
                </div>
              </Field>
              <Field label="Descripción en el checkout" hint="Una línea que explique cómo se paga.">
                <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder="Transferencia o depósito. Confirmamos el pago a mano." />
              </Field>
              <Field label="Icono" hint="Se usa en el checkout y en esta lista.">
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy"><Icon name={form.icon} size={18} /></span>
                  <select className={inputCls} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                    {NOMBRES_ICONO.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </Field>
              <Field label="Comisión (%)" hint="Se suma al total que ve el comprador.">
                <input className={inputCls} type="number" step="0.01" min="0" max="30" value={form.feePercent} onChange={(e) => setForm({ ...form, feePercent: Number(e.target.value) })} />
              </Field>
              <Field label="Orden" hint="Menor número aparece antes.">
                <input className={inputCls} type="number" min="0" max="99" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </Field>
              <Field label="Importe mínimo (USD)" hint="Vacío = sin mínimo.">
                <input className={inputCls} type="number" min="0" step="0.01" value={form.minTotalUsd ?? ""} onChange={(e) => setForm({ ...form, minTotalUsd: e.target.value === "" ? null : Number(e.target.value) })} />
              </Field>
              <Field label="Importe máximo (USD)" hint="Vacío = sin máximo.">
                <input className={inputCls} type="number" min="0" step="0.01" value={form.maxTotalUsd ?? ""} onChange={(e) => setForm({ ...form, maxTotalUsd: e.target.value === "" ? null : Number(e.target.value) })} />
              </Field>
            </div>

            {campos.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">Datos de {driver?.nombre}</p>
                <div className="mt-2 grid gap-3 sm:grid-cols-2">
                  {campos.map((c) => {
                    const valor = c.secreto ? (form.creds[c.campo] ?? "") : (form.config[c.campo] ?? "");
                    const guardado = c.secreto && editando?.creds?.[c.campo] === "definido";
                    if (c.tipo === "checkbox") {
                      return (
                        <label key={c.campo} className="flex items-start gap-2 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm text-slate-700 sm:col-span-2">
                          <input
                            type="checkbox"
                            className="mt-0.5"
                            checked={form.config[c.campo] === "true"}
                            onChange={(e) => setForm({ ...form, config: { ...form.config, [c.campo]: e.target.checked ? "true" : "false" } })}
                          />
                          <span><span className="block font-semibold">{c.etiqueta}</span>{c.ayuda && <span className="mt-0.5 block text-xs text-slate-500">{c.ayuda}</span>}</span>
                        </label>
                      );
                    }
                    return (
                      <Field key={c.campo} label={c.etiqueta} hint={guardado ? "Ya hay un valor guardado. Escribe solo si quieres cambiarlo." : c.ayuda}>
                        {c.tipo === "textarea" ? (
                          <textarea className={inputCls} rows={3} value={valor} onChange={(e) => setForm(c.secreto ? { ...form, creds: { ...form.creds, [c.campo]: e.target.value } } : { ...form, config: { ...form.config, [c.campo]: e.target.value } })} />
                        ) : c.secreto ? (
                          <PasswordField
                            autoComplete="new-password"
                            placeholder={guardado ? "•••••••• (guardado)" : c.porDefecto ?? ""}
                            value={valor}
                            onChange={(e) => setForm({ ...form, creds: { ...form.creds, [c.campo]: e.target.value } })}
                          />
                        ) : (
                          <input
                            className={inputCls}
                            type={c.tipo === "url" ? "url" : c.tipo === "number" ? "number" : "text"}
                            placeholder={c.porDefecto ?? ""}
                            value={valor}
                            onChange={(e) => setForm({ ...form, config: { ...form.config, [c.campo]: e.target.value } })}
                          />
                        )}
                      </Field>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="mt-4">
              <Field label="Instrucciones para el comprador" hint="Se muestran al elegir este método: datos bancarios, redes, notas de entrega…">
                <textarea className={inputCls} rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              </Field>
            </div>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> Activo
              </label>
              {driver?.kind === "online" && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.sandbox} onChange={(e) => setForm({ ...form, sandbox: e.target.checked })} /> Modo pruebas
                </label>
              )}
              <div className="ml-auto flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => { setForm(null); setEditando(null); }}>Cancelar</button>
                <button className="btn btn-primary btn-sm" onClick={guardar} disabled={busy}>
                  <Icon name="check" size={14} /> {busy ? "Guardando…" : "Guardar"}
                </button>
              </div>
            </div>

            {form.key && <p className="mt-3 font-mono text-[10px] text-slate-400">Clave interna: {form.key} · no cambia al renombrar</p>}
          </>
        )}
      </Modal>

      <Modal open={!!confirmar} title={confirmar?.tipo === "revocar" ? "Revocar credenciales" : "Archivar método"} onClose={() => setConfirmar(null)}>
        <p className="text-sm text-slate-600">
          {confirmar?.tipo === "revocar"
            ? `Se borrarán las credenciales de ${confirmar.metodo.name} y el método quedará desactivado. Los pedidos anteriores no cambian.`
            : `${confirmar?.metodo.name} dejará de aparecer en el checkout. Los pedidos anteriores conservan su método y su nombre.`}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmar(null)}>Cancelar</button>
          <button className={`btn btn-sm ${confirmar?.tipo === "revocar" ? "btn-danger" : "btn-primary"}`} onClick={ejecutarConfirmacion}>
            {confirmar?.tipo === "revocar" ? "Revocar" : "Archivar"}
          </button>
        </div>
      </Modal>
    </>
  );
}
