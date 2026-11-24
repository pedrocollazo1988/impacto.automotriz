"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";
import Turnstile from "@/components/Turnstile";

export default function VerifyBanner() {
  const [pin, setPin] = useState("");
  const [token, setToken] = useState("");
  const [captchaKey, setCaptchaKey] = useState(0);
  const [msg, setMsg] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  const verificar = async () => {
    setError(""); setMsg("");
    if (!/^\d{6}$/.test(pin)) return setError("Escribe el código de 6 dígitos.");
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !token) return setError("Completa la verificación anti-bots.");
    setBusy(true);
    const r = await fetch("/api/account/verify-pin", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pin, turnstileToken: token }),
    });
    const j = await r.json().catch(() => ({}));
    setBusy(false);
    if (r.ok) { setMsg("¡Correo confirmado!"); setTimeout(() => location.reload(), 700); return; }
    setPin(""); setToken(""); setCaptchaKey((k) => k + 1);
    setError(j.error ?? "Código incorrecto o vencido.");
  };

  const reenviar = async () => {
    setError(""); setMsg("");
    const r = await fetch("/api/account/verify-resend", { method: "POST" });
    setMsg(r.ok ? "Te enviamos un código nuevo. Revisa también el correo no deseado." : "Espera unos minutos antes de pedir otro código.");
  };

  return (
    <div className="card border-amber-200 bg-amber-50 p-4 text-sm text-amber-900">
      <div className="flex items-start gap-3">
        <Icon name="mail" size={18} />
        <div className="min-w-0 flex-1">
          <p className="font-semibold">Confirma tu correo con el código de 6 dígitos.</p>
          <p className="mt-0.5 text-xs text-amber-800">Lo enviamos a tu correo al crear la cuenta. Vence en 10 minutos y no se puede reutilizar.</p>
          <div className="mt-3 flex flex-wrap items-center gap-2">
            <input
              value={pin}
              onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))}
              inputMode="numeric"
              autoComplete="one-time-code"
              maxLength={6}
              aria-label="Código de verificación"
              placeholder="000000"
              className="h-10 w-32 rounded-lg border border-amber-300 bg-white px-3 text-center font-mono text-lg tracking-[0.35em] text-slate-900 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-200"
            />
            <button type="button" disabled={busy} onClick={verificar} className="btn btn-primary h-10 disabled:opacity-50">
              {busy ? "Comprobando…" : "Confirmar"}
            </button>
            <button type="button" onClick={reenviar} className="btn btn-ghost h-10 border-amber-300 px-3 text-xs text-amber-800">Reenviar código</button>
          </div>
          <Turnstile key={captchaKey} onToken={setToken} className="mt-2" />
          {error && <p role="alert" className="mt-2 text-xs font-medium text-red-700">{error}</p>}
          {msg && <p role="status" className="mt-2 text-xs font-medium text-emerald-800">{msg}</p>}
        </div>
      </div>
    </div>
  );
}
