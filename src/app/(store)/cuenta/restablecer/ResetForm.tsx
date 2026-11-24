"use client";
import { useState } from "react";
import PasswordField from "@/components/PasswordField";
export default function ResetForm({ token }: { token: string }) {
  const [p, setP] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const guardar = async () => {
    setErr(""); setMsg("");
    if (p.length < 8) return setErr("La contraseña debe tener al menos 8 caracteres.");
    setBusy(true);
    const r = await fetch("/api/account/reset", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ token, password: p }) });
    setBusy(false);
    if (r.ok) return setMsg("Contraseña actualizada. Ya puedes iniciar sesión.");
    setErr((await r.json()).error ?? "No se pudo cambiar la contraseña. Revisa los datos.");
  };
  return (
    <div className="card mx-auto max-w-sm space-y-4 p-6">
      <h1 className="font-display text-2xl font-extrabold text-navy">Nueva contraseña</h1>
      <div>
        <PasswordField placeholder="Mínimo 8 caracteres" autoComplete="new-password" value={p} onChange={(e) => setP(e.target.value)} />
        {err && <p role="alert" className="mt-1.5 text-xs text-red-600">{err}</p>}
      </div>
      <button className="btn btn-primary w-full" disabled={busy} onClick={guardar}>{busy ? "Guardando…" : "Guardar"}</button>
      {msg && <p role="status" className="rounded-lg bg-emerald-50 p-3 text-sm text-emerald-800">{msg}</p>}
    </div>);
}
