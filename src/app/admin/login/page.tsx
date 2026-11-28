"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";
import Logo from "@/components/brand/Logo";
import PasswordField from "@/components/PasswordField";
import Turnstile from "@/components/Turnstile";
import { usePreferences } from "@/components/site/Preferences";

export default function Login() {
  const { t } = usePreferences();
  const [e, setE] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState(""); const [captchaKey, setCaptchaKey] = useState(0);
  const go = async () => {
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())) return setErr(t("adm.shell.errEmail"));
    if (!p) return setErr(t("adm.shell.errPassword"));
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha) return setErr(t("adm.shell.errCaptcha"));
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p, turnstileToken: captcha }) });
      if (r.ok) location.href = "/admin";
      else { setCaptcha(""); setCaptchaKey((k) => k + 1); setErr((await r.json()).error ?? t("adm.shell.errLogin")); }
    } catch { setErr(t("adm.shell.errConnection")); } finally { setBusy(false); }
  };
  return (
    <main className="blueprint grid min-h-screen place-items-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center gap-3 text-center text-white">
          <Logo variant="light" size="md" tagline={false} href="/admin" />
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">{t("adm.shell.loginTagline")}</p>
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
          <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t("adm.shell.emailLabel")}</span>
            <input type="email" autoComplete="username" className="input" placeholder={t("adm.shell.emailPlaceholder")} value={e} onChange={(x) => setE(x.target.value)} onKeyDown={(x) => x.key === "Enter" && go()} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t("adm.shell.password")}</span>
            <PasswordField autoComplete="current-password" placeholder="••••••••" value={p} onChange={(x) => setP(x.target.value)} onKeyDown={(x) => x.key === "Enter" && go()} /></label>
          <Turnstile key={captchaKey} onToken={setCaptcha} />
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy} onClick={go}>{busy ? t("adm.shell.signingIn") : <>{t("adm.shell.signIn")} <Icon name="arrowRight" size={16} /></>}</button>
        </div>
        <p className="mt-4 text-center text-xs text-white/50">{t("adm.shell.restricted")}</p>
      </div>
    </main>
  );
}
