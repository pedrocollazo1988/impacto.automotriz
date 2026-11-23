"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";
import Logo from "@/components/brand/Logo";
import PasswordField from "@/components/PasswordField";

export default function Login() {
  const [e, setE] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async () => {
    setErr("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e.trim())) return setErr("Escribe el correo de administración.");
    if (!p) return setErr("Escribe tu contraseña.");
    setBusy(true);
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p }) });
      if (r.ok) location.href = "/admin";
      else setErr((await r.json()).error ?? "No se pudo entrar");
    } catch { setErr("No hay conexión con el servidor"); } finally { setBusy(false); }
  };
  return (
    <main className="blueprint grid min-h-screen place-items-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center gap-3 text-center text-white">
          <Logo variant="light" size="md" tagline={false} href="/admin" />
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">Panel de administración</p>
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
          <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Correo</span>
            <input type="email" autoComplete="username" className="input" placeholder="tu@correo.com" value={e} onChange={(x) => setE(x.target.value)} onKeyDown={(x) => x.key === "Enter" && go()} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Contraseña</span>
            <PasswordField autoComplete="current-password" placeholder="••••••••" value={p} onChange={(x) => setP(x.target.value)} onKeyDown={(x) => x.key === "Enter" && go()} /></label>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy} onClick={go}>{busy ? "Entrando…" : <>Entrar <Icon name="arrowRight" size={16} /></>}</button>
        </div>
        <p className="mt-4 text-center text-xs text-white/50">Acceso restringido al personal autorizado.</p>
      </div>
    </main>
  );
}
