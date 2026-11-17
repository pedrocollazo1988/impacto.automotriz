"use client";
import { useState } from "react";
export default function ResetForm({ token }: { token: string }) {
  const [p, setP] = useState(""); const [msg, setMsg] = useState("");
  return (
    <div className="mx-auto max-w-sm space-y-3"><h1 className="text-2xl font-bold text-navy">Nueva contraseña</h1>
      <input type="password" className="w-full rounded-lg border px-3 py-2 text-sm" placeholder="Mínimo 8 caracteres" value={p} onChange={(e) => setP(e.target.value)} />
      <button className="w-full rounded-lg bg-navy py-2.5 font-semibold text-white" onClick={async () => { const r = await fetch("/api/account/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: p }) }); setMsg(r.ok ? "Contraseña actualizada. Ya puedes iniciar sesión." : (await r.json()).error ?? "Revisa los datos"); }}>Guardar</button>
      <p className="text-sm">{msg}</p></div>);
}
