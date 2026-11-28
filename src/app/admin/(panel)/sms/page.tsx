"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, PanelPad, Badge, inputCls } from "@/components/admin/ui";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

type Estado = { proveedor: string; real: boolean; listo: boolean; faltan: string[] };

export default function Sms() {
  const { t } = usePreferences();
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
      if (j.error === "AUTH_PHONE_INVALID") return setError(t("adm.sms.errPhone"));
      if (j.error === "sms_sin_configurar") return setError(t("adm.sms.errMissing").replace("{list}", (j.faltan ?? []).join(", ") || "SMS_PROVIDER"));
      return setError(t("adm.sms.errSend").replace("{error}", j.error ?? t("adm.sms.unknownError")));
    }
    setAviso(t("adm.sms.sent").replace("{provider}", j.proveedor));
  };

  return (
    <>
      <PageHeader title={t("adm.sms.title")} subtitle={t("adm.sms.subtitle")} />
      <Panel className="mb-4">
        <PanelPad>
          <div className="flex flex-wrap items-center gap-3">
            <span className="grid h-10 w-10 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="mobile" size={20} /></span>
            <div className="min-w-0 flex-1">
              <p className="font-semibold text-slate-800">
                {t("adm.sms.provider")} <span className="font-mono text-xs">{estado?.proveedor ?? "…"}</span>{" "}
                {estado && <Badge tone={estado.listo ? "ok" : estado.real ? "warn" : "mute"}>{estado.listo ? t("adm.sms.badgeReady") : estado.real ? t("adm.sms.badgeIncomplete") : t("adm.sms.badgeTest")}</Badge>}
              </p>
              <p className="mt-1 text-xs text-slate-500">
                {estado?.listo
                  ? t("adm.sms.readyHint")
                  : estado?.real
                    ? t("adm.sms.missingVars").replace("{list}", estado.faltan.join(", "))
                    : t("adm.sms.noCredentials")}
              </p>
            </div>
            <button className="btn btn-ghost" onClick={cargar}><Icon name="refresh" size={14} /> {t("adm.sms.refresh")}</button>
          </div>
        </PanelPad>
      </Panel>

      <Panel>
        <PanelPad>
          <p className="text-sm font-semibold text-slate-800">{t("adm.sms.testTitle")}</p>
          <p className="mt-1 text-xs text-slate-500">{t("adm.sms.testHint")}</p>
          <div className="mt-4 flex flex-wrap items-end gap-2">
            <label className="space-y-1">
              <span className="block text-xs font-semibold text-slate-600">{t("adm.sms.phoneLabel")}</span>
              <input className={`${inputCls} w-56`} placeholder="+5355551234" value={telefono} onChange={(e) => setTelefono(e.target.value)} />
            </label>
            <button className="btn btn-primary disabled:opacity-50" disabled={busy || telefono.trim().length < 4} onClick={probar}>
              <Icon name="send" size={14} /> {busy ? t("adm.sms.sending") : t("adm.sms.sendTest")}
            </button>
          </div>
          {aviso && <p className="mt-3 rounded-lg bg-green-50 px-3 py-2 text-sm text-green-700">{aviso}</p>}
          {error && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        </PanelPad>
      </Panel>
    </>
  );
}
