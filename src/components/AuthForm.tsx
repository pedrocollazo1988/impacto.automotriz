"use client";
import { useState } from "react";

export default function AuthForm({ google = false }: { google?: boolean }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", marketing: false }); const [msg, setMsg] = useState(""); const [busy, setBusy] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const go = async () => {
    setBusy(true); setMsg("");
    const url = mode === "login" ? "/api/account/session" : mode === "register" ? "/api/account/register" : "/api/account/forgot";
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) }); const j = await r.json(); setBusy(false);
    if (!r.ok) return setMsg(j.error ?? "Revisa los datos");
    if (mode === "forgot") return setMsg("Si el correo existe, te enviamos un enlace para restablecer la contraseña.");
    location.reload();
  };
  const i = "w-full rounded-lg border px-3 py-2 text-sm";
  return (
    <div className="mx-auto max-w-sm space-y-3">
      <h1 className="text-2xl font-bold text-navy">{mode === "login" ? "Iniciar sesión" : mode === "register" ? "Crear cuenta" : "Recuperar contraseña"}</h1>
      {mode === "register" && <><input className={i} placeholder="Nombre completo" value={f.name} onChange={(e) => set("name", e.target.value)} /><input className={i} placeholder="Teléfono (opcional)" value={f.phone} onChange={(e) => set("phone", e.target.value)} /></>}
      <input className={i} type="email" placeholder="Correo" value={f.email} onChange={(e) => set("email", e.target.value)} />
      {mode !== "forgot" && <input className={i} type="password" placeholder="Contraseña (mínimo 8 caracteres)" value={f.password} onChange={(e) => set("password", e.target.value)} />}
      {mode === "register" && <label className="flex gap-2 text-xs text-slate-600"><input type="checkbox" checked={f.marketing} onChange={(e) => set("marketing", e.target.checked)} />Quiero recibir novedades y ofertas por correo (puedes darte de baja cuando quieras).</label>}
      <button disabled={busy} onClick={go} className="w-full rounded-lg bg-navy py-2.5 font-semibold text-white disabled:opacity-50">{mode === "login" ? "Entrar" : mode === "register" ? "Crear cuenta" : "Enviar enlace"}</button>
      {google && mode !== "forgot" && <a href="/api/account/google/start" className="block rounded-lg border py-2.5 text-center text-sm font-medium hover:bg-slate-50">Continuar con Google</a>}
      {msg && <p className="text-sm text-slate-700">{msg}</p>}
      <div className="flex justify-between text-sm text-navy underline">
        {mode !== "login" && <button onClick={() => setMode("login")}>Ya tengo cuenta</button>}
        {mode !== "register" && <button onClick={() => setMode("register")}>Crear cuenta</button>}
        {mode === "login" && <button onClick={() => setMode("forgot")}>Olvidé mi contraseña</button>}
      </div>
    </div>);
}
