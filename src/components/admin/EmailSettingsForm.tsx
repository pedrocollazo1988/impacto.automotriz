"use client";
import { useEffect, useState } from "react";
import { inputCls } from "@/components/admin/ui";

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
  }).catch(() => setError("No se pudo leer la configuración de correo."));
  useEffect(() => { load(); }, []);

  const save = async () => {
    setBusy(true); setMsg(""); setError("");
    const r = await fetch("/api/admin/email-settings", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...f, smtpPass: f.smtpPass || undefined }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(j.error ?? "No se pudo guardar.");
    setF((p) => ({ ...p, smtpPass: "" }));
    setMsg(j.verified === false ? `Guardado, pero el servidor no verificó la conexión: ${j.error ?? "revisa host, puerto y clave."}` : "Configuración guardada y conexión SMTP verificada.");
    load();
  };

  const test = async () => {
    if (!testTo) return;
    setBusy(true); setMsg(""); setError("");
    const r = await fetch("/api/admin/email-settings/test", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ to: testTo }) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) return setError(j.error ?? "No se pudo enviar la prueba.");
    setMsg(`Prueba enviada a ${testTo}. Revisa también spam.`);
  };

  const set = <K extends keyof Config>(k: K, v: Config[K]) => setF((p) => ({ ...p, [k]: v }));

  return (
    <details className="adm-panel mb-6">
      <summary className="cursor-pointer px-4 py-3 font-semibold text-navy">
        Servidor de correo
        {status && (
          <span className={`ml-2 rounded-full px-2 py-0.5 text-xs ${status.configured ? "bg-emerald-100 text-emerald-800" : "bg-amber-100 text-amber-800"}`}>
            {status.configured ? `Configurado (${status.source === "env" ? "variables de entorno" : "panel"})` : "Sin configurar"}
          </span>
        )}
      </summary>
      <div className="grid gap-3 border-t border-slate-100 p-4 md:grid-cols-2">
        {!status?.configured && (
          <p className="md:col-span-2 rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">
            Sin SMTP no salen los códigos de verificación ni los correos de pedidos. Configúralo aquí o define SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM_EMAIL en Vercel.
          </p>
        )}
        <label className="text-xs font-semibold text-slate-600">Remitente (nombre)<input className={`${inputCls} mt-1`} value={f.fromName} onChange={(e) => set("fromName", e.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Remitente (correo)<input className={`${inputCls} mt-1`} type="email" value={f.fromEmail} onChange={(e) => set("fromEmail", e.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Responder a<input className={`${inputCls} mt-1`} type="email" value={f.replyTo} onChange={(e) => set("replyTo", e.target.value)} /></label>
        <label className="text-xs font-semibold text-slate-600">Servidor SMTP<input className={`${inputCls} mt-1`} value={f.smtpHost} onChange={(e) => set("smtpHost", e.target.value)} placeholder="smtp.gmail.com" /></label>
        <label className="text-xs font-semibold text-slate-600">Puerto<input className={`${inputCls} mt-1`} type="number" value={f.smtpPort} onChange={(e) => set("smtpPort", Number(e.target.value))} /></label>
        <label className="flex items-center gap-2 pt-5 text-xs font-semibold text-slate-600"><input type="checkbox" checked={f.smtpSecure} onChange={(e) => set("smtpSecure", e.target.checked)} /> Conexión segura (SSL, puerto 465)</label>
        <label className="text-xs font-semibold text-slate-600">Usuario SMTP<input className={`${inputCls} mt-1`} value={f.smtpUser} onChange={(e) => set("smtpUser", e.target.value)} autoComplete="username" /></label>
        <label className="text-xs font-semibold text-slate-600">Clave o contraseña de aplicación<input className={`${inputCls} mt-1`} type="password" value={f.smtpPass} onChange={(e) => set("smtpPass", e.target.value)} placeholder={hasPassword ? "Dejar vacío para conservar la actual" : ""} autoComplete="new-password" /></label>
        <label className="text-xs font-semibold text-slate-600">Máximo por minuto<input className={`${inputCls} mt-1`} type="number" value={f.perMinute} onChange={(e) => set("perMinute", Number(e.target.value))} /></label>
        <label className="text-xs font-semibold text-slate-600">Límite diario<input className={`${inputCls} mt-1`} type="number" value={f.dailyLimit} onChange={(e) => set("dailyLimit", Number(e.target.value))} /></label>
        <label className="text-xs font-semibold text-slate-600 md:col-span-2">Firma del pie<input className={`${inputCls} mt-1`} value={f.companyInfo} onChange={(e) => set("companyInfo", e.target.value)} /></label>
        <div className="flex flex-wrap gap-2 md:col-span-2">
          <button type="button" className="btn btn-primary btn-sm" disabled={busy} onClick={save}>{busy ? "Guardando…" : "Guardar y verificar"}</button>
        </div>
        <div className="flex flex-wrap items-end gap-2 md:col-span-2">
          <label className="flex-1 text-xs font-semibold text-slate-600">Enviar prueba a<input className={`${inputCls} mt-1`} type="email" value={testTo} onChange={(e) => setTestTo(e.target.value)} placeholder="tu@correo.com" /></label>
          <button type="button" className="btn btn-ghost btn-sm" disabled={busy || !testTo} onClick={test}>Enviar prueba</button>
        </div>
        {msg && <p className="md:col-span-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-800">{msg}</p>}
        {error && <p className="md:col-span-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{error}</p>}
        <p className="md:col-span-2 text-xs text-slate-500">Gmail y Outlook suelen exigir una contraseña de aplicación, no la clave normal de la cuenta. Para el puerto 587 deja SSL desmarcado; para el 465 márcalo.</p>
      </div>
    </details>
  );
}
