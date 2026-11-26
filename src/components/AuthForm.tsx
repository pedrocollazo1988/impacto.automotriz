"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";
import PasswordField from "@/components/PasswordField";
import Turnstile from "@/components/Turnstile";
import Captcha, { type CaptchaValue } from "@/components/site/Captcha";
import { usePreferences } from "@/components/site/Preferences";

export default function AuthForm({ google = false, next }: { google?: boolean; next?: string }) {
  const { t } = usePreferences();
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", marketing: false });
  const [acepto, setAcepto] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [turnstileToken, setTurnstileToken] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "", ok: false });
  const [captchaKey, setCaptchaKey] = useState(0);
  const usaTurnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [msg, setMsg] = useState(""); const [msgOk, setMsgOk] = useState(false); const [busy, setBusy] = useState(false); const [intento, setIntento] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const errores = {
    name: mode === "register" && f.name.trim().length < 2 ? "Escribe tu nombre completo." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) ? "Escribe un correo válido, por ejemplo nombre@correo.com." : "",
    password: mode !== "forgot" && (f.password.length < 10 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) ? "La contraseña debe tener 10 caracteres, una letra y un número." : "",
    acepto: mode === "register" && !acepto ? "Acepta la política de privacidad para crear la cuenta." : "",
  };
  const go = async () => {
    setIntento(true);
    if (Object.values(errores).some(Boolean)) { setMsgOk(false); return setMsg("Revisa los campos marcados."); }
    if (mode === "register") {
      if (usaTurnstile && !turnstileToken) {
        setMsgOk(false); return setMsg("Completa la verificación anti-bots.");
      }
      if (!usaTurnstile && !captcha.ok) {
        setMsgOk(false); return setMsg("Escribe correctamente el código de seguridad.");
      }
    }
    setBusy(true); setMsg(""); setMsgOk(false);
    const url = mode === "login" ? "/api/account/session" : mode === "register" ? "/api/account/register" : "/api/account/forgot";
    const payload = mode === "register"
      ? { ...f, acepto, website, turnstileToken, captchaToken: captcha.token, captchaAnswer: captcha.answer }
      : { ...f, turnstileToken };
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) { setTurnstileToken(""); setCaptchaKey((k) => k + 1); return setMsg(j.error ?? "Revisa los datos"); }
    if (mode === "forgot") { setMsgOk(true); return setMsg("Si el correo existe, te enviamos un enlace para restablecer la contraseña."); }
    if (mode === "register" && j.emailSent === false) {
      setMsgOk(false);
      setMsg(j.emailError ?? "Tu cuenta se creó, pero no pudimos enviar el código de verificación. Revisa la configuración de correo.");
      setTimeout(() => { location.href = destino ?? "/cuenta"; }, 2500);
      return;
    }
    location.href = destino ?? location.pathname + location.search;
  };
  const titles = { login: t("auth.login"), register: t("auth.register"), forgot: t("auth.forgot") } as const;
  return (
    <div className="card p-6">
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {(["login", "register"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setMsg(""); setIntento(false); setTurnstileToken(""); setCaptcha({ token: "", answer: "", ok: false }); setCaptchaKey((k) => k + 1); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === m ? "bg-white text-navy shadow-sm" : "text-slate-600 hover:text-navy"}`}>
            {m === "login" ? t("auth.enter") : t("auth.create")}
          </button>
        ))}
      </div>
      <h2 className="font-display text-xl font-bold text-navy">{titles[mode]}</h2>
      <div className="mt-4 space-y-3">
        {mode === "register" && (
          <>
            <label className="block">
              <input className={`input ${intento && errores.name ? "border-red-400 ring-2 ring-red-100" : ""}`} placeholder={t("auth.name")} autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={intento && !!errores.name} />
              {intento && errores.name && <span className="mt-1 block text-xs text-red-600">{errores.name}</span>}
            </label>
            <input className="input" placeholder={t("auth.phone")} autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </>
        )}
        <label className="block">
          <input className={`input ${intento && errores.email ? "border-red-400 ring-2 ring-red-100" : ""}`} type="email" placeholder={t("auth.email")} autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={intento && !!errores.email} />
          {intento && errores.email && <span className="mt-1 block text-xs text-red-600">{errores.email}</span>}
        </label>
        {mode !== "forgot" && (
          <div>
            <PasswordField placeholder={t("auth.password")} autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={(e) => set("password", e.target.value)} />
            {intento && errores.password && <span className="mt-1 block text-xs text-red-600">{errores.password}</span>}
          </div>
        )}
        {mode === "register" && (
          <>
            <label className="flex gap-2 text-xs text-slate-600"><input type="checkbox" checked={f.marketing} onChange={(e) => set("marketing", e.target.checked)} className="mt-0.5" />{t("auth.marketing")}</label>
            <label className={`flex gap-2 text-xs ${intento && errores.acepto ? "text-red-600" : "text-slate-600"}`}>
              <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5" aria-invalid={intento && !!errores.acepto} />
              <span>{t("auth.accept")}</span>
            </label>
            {intento && errores.acepto && <span className="block text-xs text-red-600">{errores.acepto}</span>}
          </>
        )}
        {/* Campo trampa: una persona no lo ve ni lo rellena. */}
        <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
          <label>No rellenar<input tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
        </div>
        {mode === "register" && (
          usaTurnstile
            ? <Turnstile key={captchaKey} onToken={setTurnstileToken} />
            : <Captcha key={captchaKey} onChange={setCaptcha} error={intento && !captcha.ok ? t("auth.captcha") : ""} />
        )}
        <button disabled={busy} onClick={go} className="btn btn-primary w-full disabled:opacity-50">
          {mode === "login" ? t("auth.enter") : mode === "register" ? t("auth.create") : t("auth.send")}
        </button>
        {google && mode !== "forgot" && (
          <a href="/api/account/google/start" className="btn btn-ghost w-full">
            <Icon name="user" size={16} /> {t("auth.google")}
          </a>
        )}
        {msg && <p role="status" className={`rounded-lg p-3 text-sm ${msgOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg}</p>}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        {mode !== "forgot" && <button onClick={() => { setMode("forgot"); setMsg(""); setIntento(false); }} className="text-slate-500 hover:text-navy">{t("auth.forgotLink")}</button>}
        {mode === "forgot" && <button onClick={() => { setMode("login"); setMsg(""); setIntento(false); }} className="text-[color:var(--color-action-deep)] hover:underline">{t("auth.backLogin")}</button>}
      </div>
    </div>
  );
}
