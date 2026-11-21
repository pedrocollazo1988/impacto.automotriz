"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";

export default function Login() {
  const [e, setE] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const go = async () => {
    setBusy(true); setErr("");
    try {
      const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p }) });
      if (r.ok) location.href = "/admin";
      else setErr((await r.json()).error ?? "No se pudo entrar");
    } catch { setErr("No hay conexión con el servidor"); } finally { setBusy(false); }
  };
  return (
    <main className="blueprint grid min-h-screen place-items-center bg-navy p-4">
      <div className="w-full max-w-sm">
        <div className="mb-5 flex flex-col items-center gap-2 text-center text-white">
          <span className="adm-avatar" style={{ width: "3rem", height: "3rem", background: "linear-gradient(180deg,#164a8a,#0a2c5e)", fontSize: "1.1rem" }}>IA</span>
          <h1 className="font-display text-lg font-extrabold tracking-tight">IMPACTO<span className="text-[#f0c98a]">·</span>AUTOMOTRIZ</h1>
          <p className="font-mono text-[10px] uppercase tracking-[0.24em] text-white/50">Panel de administración</p>
        </div>
        <div className="space-y-3 rounded-2xl bg-white p-6 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]">
          <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Correo</span>
            <input type="email" autoComplete="username" className="input" placeholder="tu@correo.com" value={e} onChange={(x) => setE(x.target.value)} onKeyDown={(x) => x.key === "Enter" && go()} /></label>
          <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Contraseña</span>
            <input type="password" autoComplete="current-password" className="input" placeholder="••••••••" value={p} onChange={(x) => setP(x.target.value)} onKeyDown={(x) => x.key === "Enter" && go()} /></label>
          {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
          <button className="btn btn-primary w-full" disabled={busy} onClick={go}>{busy ? "Entrando…" : <>Entrar <Icon name="arrowRight" size={16} /></>}</button>
        </div>
        <p className="mt-4 text-center text-xs text-white/50">Acceso restringido al personal autorizado.</p>
      </div>
    </main>
  );
}
