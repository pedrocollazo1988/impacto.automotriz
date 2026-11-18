"use client";
import { useState } from "react";
export default function ResetForm({ token }: { token: string }) {
  const [p, setP] = useState(""); const [msg, setMsg] = useState("");
  return (
    <div className="card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-display text-2xl font-extrabold text-navy">Nueva contraseña</h1>
      <input type="password" className="input" placeholder="Mínimo 8 caracteres" value={p} onChange={(e) => setP(e.target.value)} />
      <button className="btn btn-primary w-full" onClick={async () => { const r = await fetch("/api/account/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: p }) }); setMsg(r.ok ? "Contraseña actualizada. Ya puedes iniciar sesión." : (await r.json()).error ?? "Revisa los datos"); }}>Guardar</button>
      {msg && <p className="rounded-lg bg-slate-50 p-3 text-sm text-slate-600">{msg}</p>}
    </div>);
}
