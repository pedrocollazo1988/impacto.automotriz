"use client";
import { useEffect, useState } from "react";
import Icon from "@/components/brand/Icon";
import TelegramLogin from "@/components/TelegramLogin";
import PasswordField from "@/components/PasswordField";
import Turnstile from "@/components/Turnstile";
import Captcha, { type CaptchaValue } from "@/components/site/Captcha";
import CodigoOtp from "@/components/CodigoOtp";
import PhoneField from "@/components/phone/PhoneField";
import { usePreferences } from "@/components/site/Preferences";

type Canal = "email" | "phone";
type Modo = "login" | "register" | "forgot" | "codigo";
type Proposito = "register" | "login" | "reset";

export default function AuthForm({ google = false, telegram = "", next }: { google?: boolean; telegram?: string; next?: string }) {
  const { t, lang } = usePreferences();
  const destino = next && next.startsWith("/") && !next.startsWith("//") ? next : null;
  const [modo, setModo] = useState<Modo>("login");
  const [canal, setCanal] = useState<Canal>("email");
  const [conClave, setConClave] = useState(false); // teléfono + contraseña en lugar de código
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "" });
  const [marketing, setMarketing] = useState(false);
  const [acepto, setAcepto] = useState(false);
  const [website, setWebsite] = useState(""); // honeypot
  const [turnstileToken, setTurnstileToken] = useState("");
  const [captcha, setCaptcha] = useState<CaptchaValue>({ token: "", answer: "", ok: false });
  const [captchaKey, setCaptchaKey] = useState(0);
  const usaTurnstile = !!process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;
  const [msg, setMsg] = useState("");
  const [msgOk, setMsgOk] = useState(false);
  const [busy, setBusy] = useState(false);
  const [intento, setIntento] = useState(false);

  const [codigo, setCodigo] = useState("");
  const [otp, setOtp] = useState<{ telefono: string; proposito: Proposito } | null>(null);
  const [espera, setEspera] = useState(0);
  // El teléfono solo se ofrece si hay un proveedor de SMS real: en modo prueba
  // el código no llega y el cliente se quedaría fuera sin saber por qué.
  const [smsListo, setSmsListo] = useState<boolean | null>(null); // null = aún no se sabe
  const [smsProveedor, setSmsProveedor] = useState("");
  useEffect(() => {
    let vivo = true;
    fetch("/api/account/phone/otp")
      .then((r) => r.json())
      .then((j) => { if (vivo) { setSmsListo(j?.disponible === true); setSmsProveedor(typeof j?.proveedor === "string" ? j.proveedor : ""); } })
      .catch(() => {});
    return () => { vivo = false; };
  }, []);
  const whatsapp = smsProveedor === "whatsapp";
  const puedeTelefono = smsListo === true;
  useEffect(() => { if (!puedeTelefono && canal === "phone") setCanal("email"); }, [puedeTelefono, canal]);

  const set = (k: keyof typeof f, v: string) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => {
    if (espera <= 0) return;
    const id = setTimeout(() => setEspera((s) => s - 1), 1000);
    return () => clearTimeout(id);
  }, [espera]);

  /** Los errores del servidor llegan como código (AUTH_...); se traducen aquí. */
  const mensaje = (codigoError?: string) => {
    if (!codigoError) return t("err.default");
    const clave = `err.${codigoError}`;
    const traducido = t(clave);
    return traducido === clave ? codigoError : traducido;
  };

  const errores = {
    name: modo === "register" && canal === "phone" && f.name.trim().length < 2 ? t("auth.name") : "",
    email: canal === "email" && !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) ? t("auth.email") : "",
    phone: canal === "phone" && f.phone.length > 0 && !/^\+[1-9]\d{5,15}$/.test(f.phone) ? t("err.AUTH_PHONE_INVALID") : "",
    password: canal === "email" && modo !== "forgot" && (f.password.length < 10 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) ? t("auth.password") : "",
    passwordTel: canal === "phone" && conClave && (f.password.length < 10 || !/[A-Za-z]/.test(f.password) || !/\d/.test(f.password)) ? t("auth.password") : "",
    acepto: modo === "register" && !acepto ? t("auth.accept") : "",
  };

  const irACodigo = (telefono: string, proposito: Proposito, esperaSrv = 60) => {
    setOtp({ telefono, proposito });
    setCodigo("");
    setEspera(esperaSrv);
    setModo("codigo");
    setMsg("");
    setMsgOk(false);
  };

  const pedirOtp = async (proposito: Proposito) => {
    setBusy(true); setMsg("");
    const r = await fetch(modo === "register" ? "/api/account/phone/register" : "/api/account/phone/otp", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(
        modo === "register"
          ? { name: f.name, phone: f.phone, ...(f.password ? { password: f.password } : {}), marketing, acepto, website, turnstileToken, captchaToken: captcha.token, captchaAnswer: captcha.answer }
          : { phone: f.phone, purpose: proposito === "reset" ? "reset" : "login", turnstileToken },
      ),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    setTurnstileToken("");
    setCaptchaKey((k) => k + 1);
    if (!r.ok) { setMsgOk(false); setMsg(mensaje(j.error)); return; }
    irACodigo(f.phone, proposito, typeof j.retryAfter === "number" ? j.retryAfter : 60);
    if (j.debugCode) { setMsgOk(true); setMsg(`código: ${j.debugCode}`); } // solo con SMS_MOCK_ECHO en desarrollo
  };

  const verificar = async (valor: string) => {
    if (!otp || valor.length !== 6 || busy) return;
    setBusy(true); setMsg("");
    const r = await fetch(otp.proposito === "reset" ? "/api/account/phone/reset" : "/api/account/phone/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(otp.proposito === "reset" ? { phone: otp.telefono, code: valor, password: f.password } : { phone: otp.telefono, code: valor }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setCodigo(""); setMsgOk(false); setMsg(mensaje(j.error)); return; }
    location.href = destino ?? j.redirect ?? "/cuenta";
  };

  const entrarConClave = async () => {
    setIntento(true);
    if (errores.passwordTel) { setMsgOk(false); return setMsg(errores.passwordTel); }
    setBusy(true); setMsg("");
    const r = await fetch("/api/account/session", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ phone: f.phone, password: f.password, turnstileToken }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setMsgOk(false); return setMsg(mensaje(j.error)); }
    location.href = destino ?? "/cuenta";
  };

  const irConCorreo = async () => {
    if (errores.email || errores.password || errores.acepto) { setMsgOk(false); return setMsg(t("auth.review")); }
    if (modo === "register") {
      if (usaTurnstile && !turnstileToken) { setMsgOk(false); return setMsg(t("auth.captcha")); }
      if (!usaTurnstile && !captcha.ok) { setMsgOk(false); return setMsg(t("auth.captcha")); }
    }
    setBusy(true); setMsg(""); setMsgOk(false);
    const url = modo === "login" ? "/api/account/session" : modo === "register" ? "/api/account/register" : "/api/account/forgot";
    const payload = modo === "register"
      ? { ...f, marketing, acepto, website, turnstileToken, captchaToken: captcha.token, captchaAnswer: captcha.answer }
      : { email: f.email, password: f.password, turnstileToken };
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (!r.ok) { setTurnstileToken(""); setCaptchaKey((k) => k + 1); return setMsg(mensaje(j.error)); }
    if (modo === "forgot") { setMsgOk(true); return setMsg(t("auth.resetSent")); }
    if (modo === "register" && j.emailSent === false) {
      setMsgOk(false);
      setMsg(j.emailError ?? mensaje());
      setTimeout(() => { location.href = destino ?? "/cuenta"; }, 2500);
      return;
    }
    location.href = destino ?? location.pathname + location.search;
  };

  const go = async () => {
    setIntento(true);
    if (canal === "email") return irConCorreo();
    if (modo === "register") {
      if (errores.name || errores.phone || errores.acepto) { setMsgOk(false); return setMsg(t("auth.review")); }
      if (usaTurnstile && !turnstileToken) { setMsgOk(false); return setMsg(t("auth.captcha")); }
      if (!usaTurnstile && !captcha.ok) { setMsgOk(false); return setMsg(t("auth.captcha")); }
      return pedirOtp("register");
    }
    if (modo === "forgot") return pedirOtp("reset");
    if (conClave) return entrarConClave();
    if (errores.phone) { setMsgOk(false); return setMsg(errores.phone); }
    return pedirOtp("login");
  };

  const reiniciar = (m: Modo) => {
    setModo(m); setMsg(""); setMsgOk(false); setIntento(false); setTurnstileToken("");
    setCaptcha({ token: "", answer: "", ok: false }); setCaptchaKey((k) => k + 1); setCodigo("");
  };

  const titulos = { login: t("auth.login"), register: t("auth.register"), forgot: t("auth.forgot"), codigo: t("otp.title") } as const;
  const etiquetaBoton =
    modo === "login" ? (canal === "phone" && !conClave ? t("auth.sendCode") : t("auth.enter"))
    : modo === "register" ? t("auth.create")
    : t("auth.sendCode");

  return (
    <div className="card p-6">
      {modo !== "codigo" && (
        <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1" role="tablist" aria-label={t("auth.login")}>
          {(["login", "register"] as const).map((m) => (
            <button key={m} role="tab" aria-selected={modo === m} onClick={() => reiniciar(m)} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${modo === m ? "bg-white text-navy shadow-sm" : "text-slate-600 hover:text-navy"}`}>
              {m === "login" ? t("auth.enter") : t("auth.create")}
            </button>
          ))}
        </div>
      )}

      <h2 className="font-display text-xl font-bold text-navy">{titulos[modo]}</h2>

      {(modo === "login" || modo === "register") && smsListo === false && (
        <p className="mt-3 flex items-start gap-2 rounded-xl bg-slate-50 px-3 py-2 text-xs text-slate-600">
          <Icon name="info" size={14} /> {t("auth.phoneProximamente")}
        </p>
      )}

      {(modo === "login" || modo === "register") && puedeTelefono && (
        <div className="mt-3 grid grid-cols-2 gap-2" role="radiogroup" aria-label={t("auth.byPhone")}>
          {(["email", "phone"] as const).map((c) => (
            <button
              key={c}
              type="button"
              role="radio"
              aria-checked={canal === c}
              onClick={() => { setCanal(c); setMsg(""); setMsgOk(false); setIntento(false); }}
              className={`flex min-h-10 items-center justify-center gap-2 rounded-xl border px-3 text-sm font-semibold transition ${
                canal === c ? "border-[color:var(--color-action)] bg-[color:var(--color-action)]/5 text-[color:var(--color-action-deep)]" : "border-slate-200 text-slate-600 hover:border-slate-300"
              }`}
            >
              <Icon name={c === "email" ? "mail" : "mobile"} size={15} /> {c === "email" ? t("auth.byEmail") : whatsapp ? "WhatsApp" : t("auth.byPhone")}
            </button>
          ))}
        </div>
      )}

      {modo === "codigo" && otp ? (
        <div className="mt-4 space-y-4">
          <p className="text-sm text-slate-600">{t("otp.sentTo").replace("{phone}", otp.telefono)}</p>
          <CodigoOtp
            value={codigo}
            onChange={setCodigo}
            onComplete={(v) => { if (otp.proposito !== "reset") verificar(v); }}
            error={!msgOk && msg ? msg : ""}
            disabled={busy}
          />
          {otp.proposito === "reset" && (
            <PasswordField placeholder={t("otp.newPassword")} autoComplete="new-password" value={f.password} onChange={(e) => set("password", e.target.value)} />
          )}
          <button disabled={busy || codigo.length !== 6} onClick={() => verificar(codigo)} className="btn btn-primary w-full disabled:opacity-50">
            {busy ? `${t("otp.verify")}…` : otp.proposito === "reset" ? t("otp.reset") : t("otp.verify")}
          </button>
          <p className="text-center text-xs text-slate-500">{t("otp.hint")}</p>
          <div className="flex items-center justify-between gap-2 text-sm">
            <button type="button" onClick={() => reiniciar(otp.proposito === "reset" ? "forgot" : otp.proposito === "register" ? "register" : "login")} className="text-slate-500 hover:text-navy">
              {otp.proposito === "register" ? t("otp.changePhone") : t("auth.backLogin")}
            </button>
            <button type="button" disabled={espera > 0 || busy} onClick={() => pedirOtp(otp.proposito)} className="font-semibold text-[color:var(--color-action-deep)] disabled:text-slate-400">
              {espera > 0 ? t("otp.resendIn").replace("{s}", String(espera)) : t("otp.resend")}
            </button>
          </div>
          {msg && <p role="status" className={`rounded-lg p-3 text-sm ${msgOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg}</p>}
        </div>
      ) : (
        <div className="mt-4 space-y-3">
          {modo === "register" && canal === "phone" && (
            <label className="block">
              <input className={`input ${intento && errores.name ? "border-red-400 ring-2 ring-red-100" : ""}`} placeholder={t("auth.name")} autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={intento && !!errores.name} />
            </label>
          )}

          {canal === "email" ? (
            <label className="block">
              <input className={`input ${intento && errores.email ? "border-red-400 ring-2 ring-red-100" : ""}`} type="email" placeholder={t("auth.email")} autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={intento && !!errores.email} />
            </label>
          ) : (
            <>
              <PhoneField value={f.phone} onChange={(v) => set("phone", v)} error={intento && errores.phone ? errores.phone : ""} autoFocus />
              {modo !== "forgot" && <p className="text-xs text-slate-500">{whatsapp ? t("auth.byWhatsappHint") : t("auth.byPhoneHint")}</p>}
            </>
          )}

          {canal === "email" && modo !== "forgot" && (
            <div>
              <PasswordField placeholder={t("auth.password")} autoComplete={modo === "login" ? "current-password" : "new-password"} value={f.password} onChange={(e) => set("password", e.target.value)} />
              {intento && errores.password && <span className="mt-1 block text-xs text-red-600">{errores.password}</span>}
            </div>
          )}

          {canal === "phone" && modo === "login" && conClave && (
            <div>
              <PasswordField placeholder={t("auth.password")} autoComplete="current-password" value={f.password} onChange={(e) => set("password", e.target.value)} />
              {intento && errores.passwordTel && <span className="mt-1 block text-xs text-red-600">{errores.passwordTel}</span>}
            </div>
          )}

          {canal === "phone" && modo === "register" && (
            <PasswordField placeholder={t("auth.passwordOptional")} autoComplete="new-password" value={f.password} onChange={(e) => set("password", e.target.value)} />
          )}

          {modo === "register" && (
            <>
              <label className="flex gap-2 text-xs text-slate-600"><input type="checkbox" checked={marketing} onChange={(e) => setMarketing(e.target.checked)} className="mt-0.5" />{t("auth.marketing")}</label>
              <label className={`flex gap-2 text-xs ${intento && errores.acepto ? "text-red-600" : "text-slate-600"}`}>
                <input type="checkbox" checked={acepto} onChange={(e) => setAcepto(e.target.checked)} className="mt-0.5" aria-invalid={intento && !!errores.acepto} />
                <span>{t("auth.accept")}</span>
              </label>
            </>
          )}

          {/* Campo trampa: una persona no lo ve ni lo rellena. */}
          <div className="absolute -left-[9999px] top-auto h-px w-px overflow-hidden" aria-hidden="true">
            <label>No rellenar<input tabIndex={-1} autoComplete="off" name="website" value={website} onChange={(e) => setWebsite(e.target.value)} /></label>
          </div>

          {modo === "register" && (usaTurnstile ? <Turnstile key={captchaKey} onToken={setTurnstileToken} /> : <Captcha key={captchaKey} onChange={setCaptcha} error={intento && !captcha.ok ? t("auth.captcha") : ""} />)}
          {modo !== "register" && canal === "phone" && usaTurnstile && <Turnstile key={captchaKey} onToken={setTurnstileToken} />}

          <button disabled={busy} onClick={go} className="btn btn-primary w-full disabled:opacity-50">{busy ? "…" : etiquetaBoton}</button>

          {canal === "phone" && modo === "login" && (
            <button type="button" onClick={() => { setConClave((v) => !v); setMsg(""); }} className="w-full text-center text-xs font-semibold text-slate-500 hover:text-navy">
              {conClave ? t("auth.loginWithCode") : t("auth.loginWithPassword")}
            </button>
          )}

          {google && modo !== "forgot" && (
            <a href="/api/account/google/start" className="btn btn-ghost w-full"><Icon name="user" size={16} /> {t("auth.google")}</a>
          )}

          {telegram && modo !== "forgot" && (
            <div className="w-full">
              <p className="mb-2 text-center text-xs text-slate-500">{t("auth.telegram")}</p>
              <TelegramLogin usuario={telegram} lang={lang} />
            </div>
          )}
          {msg && <p role="status" className={`rounded-lg p-3 text-sm ${msgOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg}</p>}
        </div>
      )}

      {modo !== "codigo" && (
        <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
          {modo !== "forgot" && <button onClick={() => reiniciar("forgot")} className="text-slate-500 hover:text-navy">{t("auth.forgotLink")}</button>}
          {modo === "forgot" && <button onClick={() => reiniciar("login")} className="text-[color:var(--color-action-deep)] hover:underline">{t("auth.backLogin")}</button>}
        </div>
      )}
    </div>
  );
}
