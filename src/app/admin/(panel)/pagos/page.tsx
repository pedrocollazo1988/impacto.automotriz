"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { PageHeader, Panel, PanelPad, EmptyState, Badge, Field, inputCls, Modal } from "@/components/admin/ui";
import Icon, { NOMBRES_ICONO } from "@/components/brand/Icon";
import PasswordField from "@/components/PasswordField";
import { pagoTexto } from "@/lib/pagos-i18n";
import { usePreferences } from "@/components/site/Preferences";

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
  nameEn: string | null;
  description: string;
  descriptionEn: string;
  kind: "online" | "manual";
  icon: string;
  enabled: boolean;
  archived: boolean;
  sandbox: boolean;
  sortOrder: number;
  instructions: string;
  instructionsEn: string;
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
  nameEn: string;
  description: string;
  descriptionEn: string;
  icon: string;
  enabled: boolean;
  sandbox: boolean;
  sortOrder: number;
  instructions: string;
  instructionsEn: string;
  feePercent: number;
  minTotalUsd: number | null;
  maxTotalUsd: number | null;
  config: Record<string, string>;
  creds: Record<string, string>;
};

const formularioVacio = (preset?: Preset): Formulario => ({
  provider: preset?.provider ?? "manual",
  name: preset?.nombre ?? "",
  nameEn: "",
  description: preset?.descripcion ?? "",
  descriptionEn: "",
  icon: preset?.icono ?? "bank",
  enabled: true,
  sandbox: true,
  sortOrder: 0,
  instructions: "",
  instructionsEn: "",
  feePercent: 0,
  minTotalUsd: null,
  maxTotalUsd: null,
  config: { ...(preset?.config ?? {}) },
  creds: {},
});

export default function Pagos() {
  const { t, lang } = usePreferences();
  // `t` cambia de identidad en cada render; el ref evita que `cargar` se recree
  // y dispare un bucle de peticiones en el efecto de montaje.
  const tRef = useRef(t);
  useEffect(() => { tRef.current = t; }, [t]);
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
      setErr(j.error ?? tRef.current("adm.pagos.loadError"));
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
    if (!s.length) return t("adm.pagos.credsNone");
    return s.every((c) => m.creds[c.campo]) ? t("adm.pagos.credsSet") : t("adm.pagos.credsIncomplete");
  };

  const abrir = (m: Metodo) => {
    setEditando(m);
    setForm({
      id: m.id, key: m.key, provider: m.provider, name: m.name, nameEn: m.nameEn ?? "", description: m.description, descriptionEn: m.descriptionEn, icon: m.icon,
      enabled: m.enabled, sandbox: m.sandbox, sortOrder: m.sortOrder, instructions: m.instructions, instructionsEn: m.instructionsEn,
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
    setForm((f) => f ? { ...f, provider: p.provider, name: p.nombre, nameEn: "", description: p.descripcion, descriptionEn: "", icon: p.icono, config: { ...p.config } } : formularioVacio(p));
  };

  const guardar = async () => {
    if (!form) return;
    setErr(""); setMsg("");
    if (form.name.trim().length < 2) return setErr(t("adm.pagos.errName"));
    setBusy(true);
    const body: Record<string, unknown> = {
      provider: form.provider,
      name: form.name.trim(),
      // Vacío = null/"": la web cae al español. Nunca se traduce solo.
      nameEn: form.nameEn.trim() || null,
      description: form.description,
      descriptionEn: form.descriptionEn,
      icon: form.icon,
      enabled: form.enabled,
      sandbox: form.sandbox,
      sortOrder: Number(form.sortOrder) || 0,
      instructions: form.instructions,
      instructionsEn: form.instructionsEn,
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
    if (!r.ok) return setErr(j.error ?? t("adm.pagos.errSave"));
    setMsg(form.id ? t("adm.pagos.saved") : t("adm.pagos.added"));
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
    setMsg(tipo === "revocar" ? t("adm.pagos.credsRevoked") : t("adm.pagos.archived"));
    cargar();
  };

  const activos = useMemo(() => metodos.filter((m) => m.enabled).length, [metodos]);

  return (
    <>
      <PageHeader
        title={t("adm.pagos.title")}
        subtitle={t("adm.pagos.subtitle")}
        actions={<button className="btn btn-primary btn-sm" onClick={nuevo}><Icon name="plus" size={15} /> {t("adm.pagos.add")}</button>}
      />

      {msg && <p className="mb-4 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
      {err && <p className="mb-4 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}

      <PanelPad className="mb-4">
        <div className="flex flex-wrap items-start gap-3">
          <span className="grid h-10 w-10 shrink-0 place-items-center rounded-xl bg-[color:var(--color-action)]/10 text-[color:var(--color-action-deep)]">
            <Icon name="wallet" size={20} />
          </span>
          <div className="min-w-0 flex-1">
            <p className="font-display text-sm font-bold text-navy">{t("adm.pagos.introTitle")}</p>
            <p className="mt-0.5 text-sm text-slate-500">
              {t("adm.pagos.introText")}
            </p>
          </div>
          <div className="flex items-center gap-2 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">
            <span className="h-2 w-2 rounded-full bg-emerald-500" />
            {t(activos === 1 ? "adm.pagos.activeOfTotal" : "adm.pagos.activeOfTotalPlural")
              .replace("{n}", String(activos))
              .replace("{total}", String(metodos.length))}
          </div>
        </div>
      </PanelPad>

      {cargando ? (
        <Panel><PanelPad><p className="text-sm text-slate-500">{t("adm.pagos.loading")}</p></PanelPad></Panel>
      ) : !metodos.length ? (
        <Panel><EmptyState icon="card" title={t("adm.pagos.emptyTitle")} hint={t("adm.pagos.emptyHint")} /></Panel>
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
                        <h3 className="font-display text-base font-bold text-navy">{pagoTexto(m.name, lang)}</h3>
                        <Badge tone={m.enabled ? "ok" : "mute"}>{m.enabled ? t("adm.pagos.active") : t("adm.pagos.inactive")}</Badge>
                        <Badge tone={m.kind === "online" ? "info" : "warn"}>{m.kind === "online" ? t("adm.pagos.automatic") : t("adm.pagos.manual")}</Badge>
                        {m.kind === "online" && <Badge tone={m.sandbox ? "warn" : "ok"}>{m.sandbox ? t("adm.pagos.sandbox") : t("adm.pagos.production")}</Badge>}
                      </div>
                      <p className="mt-1 text-sm text-slate-500">{pagoTexto(m.description || d?.descripcion || "", lang)}</p>
                      <p className="mt-1 font-mono text-[10px] uppercase tracking-wider text-slate-400">{pagoTexto(d?.nombre ?? m.provider, lang)} · {m.key}</p>
                    </div>
                  </div>

                  {aviso && (
                    <p className="mt-3 flex items-start gap-2 rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-900">
                      <Icon name="info" size={14} />
                      <span>{t("adm.pagos.missingWarn").replace("{list}", pendientes.map((c) => pagoTexto(c.etiqueta, lang)).join(` ${t("adm.pagos.joinAnd")} `))}</span>
                    </p>
                  )}

                  <dl className="mt-4 grid grid-cols-3 gap-2 rounded-xl bg-slate-50 p-3 text-xs">
                    <div><dt className="text-slate-400">{t("adm.pagos.fee")}</dt><dd className="mt-0.5 font-semibold text-slate-700">{m.feePercent ? `${m.feePercent} %` : t("adm.pagos.noFee")}</dd></div>
                    <div><dt className="text-slate-400">{t("adm.pagos.min")}</dt><dd className="mt-0.5 font-semibold text-slate-700">{m.minTotalUsd == null ? "—" : `${m.minTotalUsd} USD`}</dd></div>
                    <div><dt className="text-slate-400">{t("adm.pagos.max")}</dt><dd className="mt-0.5 font-semibold text-slate-700">{m.maxTotalUsd == null ? "—" : `${m.maxTotalUsd} USD`}</dd></div>
                    <div className="col-span-3 border-t border-slate-200/70 pt-2"><dt className="inline text-slate-400">{t("adm.pagos.credentials")}: </dt><dd className="inline font-semibold text-slate-700">{credenciales(m)}</dd></div>
                  </dl>

                  <div className="mt-4 flex flex-wrap items-center gap-2">
                    <button className="btn btn-ghost btn-sm" onClick={() => abrir(m)}><Icon name="edit" size={14} /> {t("adm.pagos.edit")}</button>
                    <button className={`btn btn-sm ${m.enabled ? "btn-ghost" : "btn-primary"}`} onClick={() => alternar(m)}>
                      {m.enabled ? t("adm.pagos.deactivate") : t("adm.pagos.activate")}
                    </button>
                    <div className="ml-auto flex items-center gap-1">
                      {secretos(m).length > 0 && m.creds && Object.values(m.creds).some(Boolean) && (
                        <button className="btn btn-danger btn-sm" onClick={() => setConfirmar({ tipo: "revocar", metodo: m })}>{t("adm.pagos.revoke")}</button>
                      )}
                      <button className="btn btn-quiet btn-sm text-red-600" onClick={() => setConfirmar({ tipo: "archivar", metodo: m })} aria-label={`${t("adm.pagos.archive")} ${pagoTexto(m.name, lang)}`}>
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
          <h3 className="font-display text-sm font-bold text-navy">{t("adm.pagos.howTitle")}</h3>
          <ul className="mt-2 space-y-1.5 text-sm text-slate-600">
            <li>· {t("adm.pagos.how1")}</li>
            <li>· {t("adm.pagos.how2")}</li>
            <li>· {t("adm.pagos.how3")}</li>
            <li>· {t("adm.pagos.how4")}</li>
          </ul>
        </PanelPad>
      </Panel>

      <Modal open={!!form} title={form?.id ? t("adm.pagos.editTitle") : t("adm.pagos.newTitle")} onClose={() => { setForm(null); setEditando(null); }} size="lg">
        {form && (
          <>
            {!form.id && (
              <div className="mb-5">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("adm.pagos.templateTitle")}</p>
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
                          <span className="block text-xs font-semibold text-slate-800">{pagoTexto(p.nombre, lang)}</span>
                          <span className="mt-0.5 block text-[11px] leading-snug text-slate-500">{pagoTexto(p.descripcion, lang)}</span>
                        </span>
                      </button>
                    );
                  })}
                </div>
              </div>
            )}

            <div className="grid gap-3 sm:grid-cols-2">
              <Field label={t("adm.pagos.nameLabel")} hint={t("adm.pagos.nameHint")}>
                <input className={inputCls} value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} placeholder={t("adm.pagos.namePlaceholder")} />
              </Field>
              <Field label={t("adm.pagos.typeLabel")} hint={t("adm.pagos.typeHint")}>
                <div className="input flex items-center gap-2 bg-slate-50 text-slate-600">
                  <Icon name={driver?.icono ?? "card"} size={16} />
                  {pagoTexto(driver?.nombre ?? form.provider, lang)}
                </div>
              </Field>
              <Field label={t("adm.pagos.descLabel")} hint={t("adm.pagos.descHint")}>
                <input className={inputCls} value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} placeholder={t("adm.pagos.descPlaceholder")} />
              </Field>
              <Field label={t("adm.pagos.iconLabel")} hint={t("adm.pagos.iconHint")}>
                <div className="flex items-center gap-2">
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy"><Icon name={form.icon} size={18} /></span>
                  <select className={inputCls} value={form.icon} onChange={(e) => setForm({ ...form, icon: e.target.value })}>
                    {NOMBRES_ICONO.map((n) => <option key={n} value={n}>{n}</option>)}
                  </select>
                </div>
              </Field>
              <Field label={t("adm.pagos.feeLabel")} hint={t("adm.pagos.feeHint")}>
                <input className={inputCls} type="number" step="0.01" min="0" max="30" value={form.feePercent} onChange={(e) => setForm({ ...form, feePercent: Number(e.target.value) })} />
              </Field>
              <Field label={t("adm.pagos.orderLabel")} hint={t("adm.pagos.orderHint")}>
                <input className={inputCls} type="number" min="0" max="99" value={form.sortOrder} onChange={(e) => setForm({ ...form, sortOrder: Number(e.target.value) })} />
              </Field>
              <Field label={t("adm.pagos.minLabel")} hint={t("adm.pagos.minHint")}>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.minTotalUsd ?? ""} onChange={(e) => setForm({ ...form, minTotalUsd: e.target.value === "" ? null : Number(e.target.value) })} />
              </Field>
              <Field label={t("adm.pagos.maxLabel")} hint={t("adm.pagos.maxHint")}>
                <input className={inputCls} type="number" min="0" step="0.01" value={form.maxTotalUsd ?? ""} onChange={(e) => setForm({ ...form, maxTotalUsd: e.target.value === "" ? null : Number(e.target.value) })} />
              </Field>
            </div>

            {campos.length > 0 && (
              <div className="mt-4 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{t("adm.pagos.dataTitle").replace("{name}", pagoTexto(driver?.nombre ?? "", lang))}</p>
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
                          <span><span className="block font-semibold">{pagoTexto(c.etiqueta, lang)}</span>{c.ayuda && <span className="mt-0.5 block text-xs text-slate-500">{pagoTexto(c.ayuda, lang)}</span>}</span>
                        </label>
                      );
                    }
                    return (
                      <Field key={c.campo} label={pagoTexto(c.etiqueta, lang)} hint={guardado ? t("adm.pagos.savedValueHint") : c.ayuda ? pagoTexto(c.ayuda, lang) : undefined}>
                        {c.tipo === "textarea" ? (
                          <textarea className={inputCls} rows={3} value={valor} onChange={(e) => setForm(c.secreto ? { ...form, creds: { ...form.creds, [c.campo]: e.target.value } } : { ...form, config: { ...form.config, [c.campo]: e.target.value } })} />
                        ) : c.secreto ? (
                          <PasswordField
                            autoComplete="new-password"
                            placeholder={guardado ? t("adm.pagos.savedPlaceholder") : c.porDefecto ?? ""}
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
              <Field label={t("adm.pagos.instructionsLabel")} hint={t("adm.pagos.instructionsHint")}>
                <textarea className={inputCls} rows={4} value={form.instructions} onChange={(e) => setForm({ ...form, instructions: e.target.value })} />
              </Field>
            </div>

            <section className="mt-4 rounded-xl border border-slate-200 p-3">
              <p className="flex items-center gap-1.5 text-xs font-semibold text-navy"><Icon name="globe" size={13} /> English</p>
              <p className="mb-3 mt-0.5 text-[11px] text-slate-500">{t("adm.contenido.langHintEn")}</p>
              <div className="grid gap-3 sm:grid-cols-2">
                <Field label={t("adm.pagos.nameLabel")}>
                  <input className={inputCls} value={form.nameEn} onChange={(e) => setForm({ ...form, nameEn: e.target.value })} />
                </Field>
                <Field label={t("adm.pagos.descLabel")}>
                  <input className={inputCls} value={form.descriptionEn} onChange={(e) => setForm({ ...form, descriptionEn: e.target.value })} />
                </Field>
                <div className="sm:col-span-2">
                  <Field label={t("adm.pagos.instructionsLabel")}>
                    <textarea className={inputCls} rows={3} value={form.instructionsEn} onChange={(e) => setForm({ ...form, instructionsEn: e.target.value })} />
                  </Field>
                </div>
              </div>
            </section>

            <div className="mt-4 flex flex-wrap items-center gap-4">
              <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                <input type="checkbox" checked={form.enabled} onChange={(e) => setForm({ ...form, enabled: e.target.checked })} /> {t("adm.pagos.active")}
              </label>
              {driver?.kind === "online" && (
                <label className="flex items-center gap-2 text-sm font-semibold text-slate-700">
                  <input type="checkbox" checked={form.sandbox} onChange={(e) => setForm({ ...form, sandbox: e.target.checked })} /> {t("adm.pagos.sandboxMode")}
                </label>
              )}
              <div className="ml-auto flex gap-2">
                <button className="btn btn-ghost btn-sm" onClick={() => { setForm(null); setEditando(null); }}>{t("adm.pagos.cancel")}</button>
                <button className="btn btn-primary btn-sm" onClick={guardar} disabled={busy}>
                  <Icon name="check" size={14} /> {busy ? t("adm.pagos.saving") : t("adm.pagos.save")}
                </button>
              </div>
            </div>

            {form.key && <p className="mt-3 font-mono text-[10px] text-slate-400">{t("adm.pagos.internalKey").replace("{key}", form.key)}</p>}
          </>
        )}
      </Modal>

      <Modal open={!!confirmar} title={confirmar?.tipo === "revocar" ? t("adm.pagos.revokeTitle") : t("adm.pagos.archiveTitle")} onClose={() => setConfirmar(null)}>
        <p className="text-sm text-slate-600">
          {confirmar?.tipo === "revocar"
            ? t("adm.pagos.revokeBody").replace("{name}", pagoTexto(confirmar.metodo.name, lang))
            : t("adm.pagos.archiveBody").replace("{name}", pagoTexto(confirmar?.metodo.name ?? "", lang))}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmar(null)}>{t("adm.pagos.cancel")}</button>
          <button className={`btn btn-sm ${confirmar?.tipo === "revocar" ? "btn-danger" : "btn-primary"}`} onClick={ejecutarConfirmacion}>
            {confirmar?.tipo === "revocar" ? t("adm.pagos.revoke") : t("adm.pagos.archive")}
          </button>
        </div>
      </Modal>
    </>
  );
}
