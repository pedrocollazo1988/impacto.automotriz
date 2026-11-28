"use client";
import { useEffect, useState } from "react";
import { inputCls } from "@/components/admin/ui";
import { usePreferences } from "@/components/site/Preferences";

type Config = {
  fromName: string; fromEmail: string; replyTo: string;
  smtpHost: string; smtpPort: number; smtpSecure: boolean;
  smtpUser: string; smtpPass: string;
  perMinute: number; dailyLimit: number; companyInfo: string;
};
type Status = { configured: boolean; source: "db" | "env" | null; host: string | null; port: number | null; fromEmail: string | null };
const EMPTY: Config = {
  fromName: "Impacto Automotriz", fromEmail: "", replyTo: "",
  smtpHost: "", smtpPort: 587, smtpSecure: false,
  smtpUser: "", smtpPass: "",
  perMinute: 20, dailyLimit: 300, companyInfo: "Impacto Automotriz S.U.R.L.",
};

export default function EmailSettingsForm() {
  const { t } = usePreferences();
  const [f, setF] = useState<Config>(EMPTY);
  const [status, setStatus] = useState<Status | null>(null);
  const [hasPassword, setHasPassword] = useState(false);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);
  const [testTo, setTestTo] = useState("");

  const load = () => fetch("/api/admin/email-settings").then((r) => r.json()).then((d) => {
    setStatus(d?.status ?? null);
    setHasPassword(!!d?.hasPassword);
    if (d?.smtpHost) setF({
      fromName: d.fromName ?? EMPTY.fromName, fromEmail: d.fromEmail ?? "", replyTo: d.replyTo ?? "",
      smtpHost: d.smtpHost, smtpPort: d.smtpPort ?? 587, smtpSecure: !!d.smtpSecure,
      smtpUser: d.smtpUser ?? "", smtpPass: "",
      perMinute: d.perMinute ?? 20, dailyLimit: d.dailyLimit ?? 300, companyInfo: d.companyInfo ?? EMPTY.companyInfo,
    });
  }).catch(() => setError(t("adm.correo.loadError")));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true); setMsg(""); setError("");
    const r = await fetch("/api/admin/email-settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, smtpPass: f.smtpPass || undefined }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(j.error ?? t("adm.correo.saveError"));
    setF((p) => ({ ...p, smtpPass: "" }));
    setMsg(j.verified === false
      ? t("adm.correo.savedUnverified").replace("{error}", j.error ?? t("adm.correo.checkHostPortPass"))
      : t("adm.correo.savedVerified"));
    load();
  };

  const test = async () => {
    if (!testTo) return;
    setBusy(true); setMsg(""); setError("");
    const r = await fetch("/api/admin/email-settings/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: testTo }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(j.error ?? t("adm.correo.testError"));
    setMsg(t("adm.correo.testSent").replace("{email}", testTo));
  };

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <details className="adm-panel mb-6">
      <summary className="cursor-pointer px-4 py-3 font-semibold text-navy">
        {t("adm.correo.title")}
        {status && (
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${status.configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            {status.configured
              ? t("adm.correo.statusConfigured").replace("{source}", t(status.source === "env" ? "adm.correo.sourceEnv" : "adm.correo.sourcePanel"))
              : t("adm.correo.statusUnconfigured")}
          </span>
        )}
      </summary>
      <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-2">
        {!status?.configured && (
          <p className="md:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            {t("adm.correo.noSmtpWarning")}
          </p>
        )}
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.fromName")}<input className={`${inputCls} mt-1`} value={f.fromName} onChange={(e) => set("fromName", e.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.fromEmail")}<input className={`${inputCls} mt-1`} type="email" value={f.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.replyTo")}<input className={`${inputCls} mt-1`} type="email" value={f.replyTo} onChange={(e) => set("replyTo", e.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.smtpHost")}<input className={`${inputCls} mt-1`} value={f.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} placeholder="smtp.gmail.com" /></label>
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.smtpPort")}<input className={`${inputCls} mt-1`} type="number" value={f.smtpPort} onChange={(e) => set("smtpPort", Number(e.target.value))} /></label>
        <label className="flex items-center gap-2 pt-5 text-xs font-semibold text-slate-600"><input type="checkbox" checked={f.smtpSecure} onChange={(e) => set("smtpSecure", e.target.checked)} /> {t("adm.correo.smtpSecure")}</label>
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.smtpUser")}<input className={`${inputCls} mt-1`} value={f.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} autoComplete="username" /></label>
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.smtpPass")}<input className={`${inputCls} mt-1`} type="password" value={f.smtpPass} onChange={(e) => set("smtpPass", e.target.value)} placeholder={hasPassword ? t("adm.correo.smtpPassHint") : ""} autoComplete="new-password" /></label>
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.perMinute")}<input className={`${inputCls} mt-1`} type="number" value={f.perMinute} onChange={(e) => set("perMinute", Number(e.target.value))} /></label>
        <label className="text-xs font-semibold text-slate-600">{t("adm.correo.dailyLimit")}<input className={`${inputCls} mt-1`} type="number" value={f.dailyLimit} onChange={(e) => set("dailyLimit", Number(e.target.value))} /></label>
        <label className="text-xs font-semibold text-slate-600 md:col-span-2">{t("adm.correo.footerSignature")}<input className={`${inputCls} mt-1`} value={f.companyInfo} onChange={(e) => set("companyInfo", e.target.value)} /></label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? t("adm.correo.saving") : t("adm.correo.saveVerify")}</button>
        </div>
        <div className="flex flex-wrap items-end gap-2 md:col-span-2">
          <label className="flex-1 text-xs font-semibold text-slate-600">{t("adm.correo.testTo")}<input className={`${inputCls} mt-1`} type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="tu@correo.com" /></label>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !testTo} onClick={test}>{t("adm.correo.sendTest")}</button>
        </div>
        {msg && <p className="md:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
        {error && <p className="md:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <p className="md:col-span-2 text-xs text-slate-500">{t("adm.correo.providerNote")}</p>
      </div>
    </details>
  );
}
