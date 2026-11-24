"use client";
import { useState } from "react";
import PasswordField from "@/components/PasswordField";
import Turnstile from "@/components/Turnstile";
export default function ResetForm({ token }: { token: string }) {
  const [p, setP] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState(""); const [captchaKey, setCaptchaKey] = useState(0);
  const guardar = async () => {
    setErr(""); setMsg("");
    if (p.length < 10 || !/[A-Za-z]/.test(p) || !/\d/.test(p)) return setErr("La contraseña debe tener 10 caracteres, una letra y un número.");
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha) return setErr("Completa la verificación anti-bots.");
    setBusy(true);
    const r = await fetch("/api/account/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: p, turnstileToken: captcha }) });
    setBusy(false);
    if (r.ok) { setCaptcha(""); setCaptchaKey((k) => k + 1); return setMsg("Contraseña actualizada. Ya puedes iniciar sesión."); }
    setCaptcha(""); setCaptchaKey((k) => k + 1);
    setErr((await r.json()).error ?? "No se pudo cambiar la contraseña. Revisa los datos.");
  };
  return (
    <div className="card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-display text-2xl font-extrabold text-navy">Nueva contraseña</h1>
      <div>
        <PasswordField placeholder="10 caracteres, letra y número" autoComplete="new-password" value={p} onChange={(e) => setP(e.target.value)} />
        {err && <p role="alert" className="mt-1.5 text-xs text-red-600">{err}</p>}
      </div>
      <Turnstile key={captchaKey} onToken={setCaptcha} />
      <button className="btn btn-primary w-full" disabled={busy} onClick={guardar}>{busy ? "Guardando…" : "Guardar"}</button>
      {msg && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</p>}
    </div>);
}
