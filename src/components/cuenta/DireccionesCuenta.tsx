"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";
import { MAX_DIRECCIONES, textoDireccion } from "@/lib/direcciones";

export type DireccionGuardada = {
  id: number; label: string; recipientName: string; recipientPhone: string;
  provinceId: number; provinceName: string; municipalityId: number; municipalityName: string;
  address: string; reference: string | null; isDefault: boolean;
};

type Opt = { id: number; name: string };
const VACIO = { label: "", recipientName: "", recipientPhone: "", provinceId: "", municipalityId: "", address: "", reference: "" };

export default function DireccionesCuenta({ iniciales }: { iniciales: DireccionGuardada[] }) {
  const { t } = usePreferences();
  const router = useRouter();
  const [provs, setProvs] = useState<Opt[]>([]);
  const [muns, setMuns] = useState<Opt[]>([]);
  const [form, setForm] = useState({ ...VACIO });
  const [editando, setEditando] = useState<number | null>(null);
  const [abierto, setAbierto] = useState(iniciales.length === 0);
  const [error, setError] = useState("");
  const [guardando, setGuardando] = useState(false);
  const [borrando, setBorrando] = useState<number | null>(null);

  useEffect(() => { fetch("/api/geo").then((r) => r.json()).then(setProvs).catch(() => setProvs([])); }, []);
  useEffect(() => {
    setMuns([]);
    if (!form.provinceId) return;
    fetch(`/api/geo?provinceId=${form.provinceId}`).then((r) => r.json()).then(setMuns).catch(() => setMuns([]));
  }, [form.provinceId]);

  const set = (k: keyof typeof VACIO, v: string) => setForm((p) => ({ ...p, [k]: v }));

  const abrirNueva = () => { setEditando(null); setForm({ ...VACIO }); setError(""); setAbierto(true); };
  const abrirEdicion = (d: DireccionGuardada) => {
    setEditando(d.id);
    setForm({
      label: d.label, recipientName: d.recipientName, recipientPhone: d.recipientPhone,
      provinceId: String(d.provinceId), municipalityId: String(d.municipalityId),
      address: d.address, reference: d.reference ?? "",
    });
    setError(""); setAbierto(true);
  };

  const enviar = async () => {
    setError(""); setGuardando(true);
    const cuerpo = {
      label: form.label, recipientName: form.recipientName, recipientPhone: form.recipientPhone,
      provinceId: Number(form.provinceId) || 0, municipalityId: Number(form.municipalityId) || 0,
      address: form.address, reference: form.reference,
    };
    const r = await fetch(editando ? `/api/account/direcciones/${editando}` : "/api/account/direcciones", {
      method: editando ? "PATCH" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    });
    setGuardando(false);
    if (!r.ok) {
      const d = await r.json().catch(() => ({}));
      setError(t(String(d.error ?? "dir.errGeneral")));
      return;
    }
    setForm({ ...VACIO }); setEditando(null); setAbierto(iniciales.length === 0);
    router.refresh();
  };

  const marcarPrincipal = async (d: DireccionGuardada) => {
    setError("");
    const r = await fetch(`/api/account/direcciones/${d.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        label: d.label, recipientName: d.recipientName, recipientPhone: d.recipientPhone,
        provinceId: d.provinceId, municipalityId: d.municipalityId,
        address: d.address, reference: d.reference ?? "", principal: true,
      }),
    });
    if (!r.ok) setError(t("dir.errGeneral"));
    router.refresh();
  };

  const eliminar = async (id: number) => {
    setError(""); setBorrando(null);
    const r = await fetch(`/api/account/direcciones/${id}`, { method: "DELETE" });
    if (!r.ok) setError(t("dir.errGeneral"));
    router.refresh();
  };

  const campo = "input";
  const etiqueta = "mb-1 block text-xs font-semibold text-slate-500";

  return (
    <div className="space-y-4">
      <p className="text-sm text-slate-500">{t("dir.hint")}</p>

      {iniciales.length === 0 && !abierto && <p className="text-sm text-slate-500">{t("dir.empty")}</p>}

      {iniciales.length > 0 && (
        <ul className="grid gap-3 sm:grid-cols-2">
          {iniciales.map((d) => (
            <li key={d.id} className={`card p-4 ${d.isDefault ? "ring-1 ring-[color:var(--color-accent)]/40" : ""}`}>
              <div className="flex items-start justify-between gap-2">
                <p className="flex flex-wrap items-center gap-2 font-semibold text-slate-800">
                  <Icon name="pin" size={16} className="text-[color:var(--color-accent)]" />
                  {d.label}
                  {d.isDefault && <span className="badge bg-[color:var(--color-accent-soft)] text-[color:var(--color-accent-hover)]">{t("dir.principal")}</span>}
                </p>
                <div className="flex items-center gap-1">
                  <button type="button" onClick={() => abrirEdicion(d)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-500 transition hover:bg-slate-100 hover:text-navy" aria-label={`${t("dir.edit")} ${d.label}`} title={t("dir.edit")}>
                    <Icon name="edit" size={16} />
                  </button>
                  <button type="button" onClick={() => setBorrando(borrando === d.id ? null : d.id)} className="grid h-8 w-8 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600" aria-label={`${t("dir.delete")} ${d.label}`} title={t("dir.delete")}>
                    <Icon name="trash" size={16} />
                  </button>
                </div>
              </div>
              <p className="mt-2 text-sm text-slate-600">{d.recipientName} · {d.recipientPhone}</p>
              <p className="text-sm text-slate-500">{textoDireccion(d)}</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {!d.isDefault && (
                  <button type="button" onClick={() => marcarPrincipal(d)} className="btn btn-ghost h-8 px-2.5 text-xs">
                    <Icon name="check" size={14} /> {t("dir.makeDefault")}
                  </button>
                )}
                {borrando === d.id && (
                  <>
                    <span className="text-xs font-semibold text-red-600">{t("dir.confirmDelete")}</span>
                    <button type="button" onClick={() => eliminar(d.id)} className="btn btn-danger h-8 px-2.5 text-xs">{t("dir.yesDelete")}</button>
                    <button type="button" onClick={() => setBorrando(null)} className="btn btn-ghost h-8 px-2.5 text-xs">{t("dir.cancel")}</button>
                  </>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}

      {!abierto && iniciales.length < MAX_DIRECCIONES && (
        <button type="button" onClick={abrirNueva} className="btn btn-primary"><Icon name="plus" size={16} /> {t("dir.add")}</button>
      )}

      {abierto && (
        <form
          className="card space-y-3 p-4"
          onSubmit={(e) => { e.preventDefault(); enviar(); }}
        >
          <div className="grid gap-3 sm:grid-cols-2">
            <label><span className={etiqueta}>{t("dir.label")}</span>
              <input className={campo} value={form.label} onChange={(e) => set("label", e.target.value)} placeholder={t("dir.labelHint")} maxLength={24} />
            </label>
            <label><span className={etiqueta}>{t("dir.recipient")}</span>
              <input className={campo} value={form.recipientName} onChange={(e) => set("recipientName", e.target.value)} maxLength={80} required />
            </label>
            <label><span className={etiqueta}>{t("dir.phone")}</span>
              <input className={campo} value={form.recipientPhone} onChange={(e) => set("recipientPhone", e.target.value)} inputMode="tel" placeholder="54099988" required />
            </label>
            <label><span className={etiqueta}>{t("dir.province")}</span>
              <select className={`${campo} input-select`} value={form.provinceId} onChange={(e) => { set("provinceId", e.target.value); set("municipalityId", ""); }} required>
                <option value="">{t("dir.choose")}</option>
                {provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}
              </select>
            </label>
            <label><span className={etiqueta}>{t("dir.municipality")}</span>
              <select className={`${campo} input-select`} value={form.municipalityId} onChange={(e) => set("municipalityId", e.target.value)} disabled={!form.provinceId} required>
                <option value="">{t("dir.choose")}</option>
                {muns.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}
              </select>
            </label>
            <label><span className={etiqueta}>{t("dir.reference")}</span>
              <input className={campo} value={form.reference} onChange={(e) => set("reference", e.target.value)} placeholder={t("dir.referenceHint")} maxLength={120} />
            </label>
          </div>
          <label className="block"><span className={etiqueta}>{t("dir.address")}</span>
            <input className={campo} value={form.address} onChange={(e) => set("address", e.target.value)} placeholder={t("dir.addressHint")} maxLength={160} required />
          </label>
          <div className="flex flex-wrap items-center gap-2">
            <button type="submit" className="btn btn-accent" disabled={guardando}>
              <Icon name="check" size={16} /> {guardando ? t("dir.saving") : t("dir.save")}
            </button>
            <button type="button" className="btn btn-ghost" onClick={() => { setAbierto(false); setEditando(null); setError(""); }}>{t("dir.cancel")}</button>
          </div>
        </form>
      )}

      {error && <p role="alert" className="text-sm text-red-600">{error}</p>}
    </div>
  );
}
