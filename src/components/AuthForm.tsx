"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";
import PasswordField from "@/components/PasswordField";

export default function AuthForm({ google = false }: { google?: boolean }) {
  const [mode, setMode] = useState<"login" | "register" | "forgot">("login");
  const [f, setF] = useState({ name: "", email: "", phone: "", password: "", marketing: false });
  const [msg, setMsg] = useState(""); const [msgOk, setMsgOk] = useState(false); const [busy, setBusy] = useState(false); const [intento, setIntento] = useState(false);
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));
  const errores = {
    name: mode === "register" && f.name.trim().length < 2 ? "Escribe tu nombre completo." : "",
    email: !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(f.email.trim()) ? "Escribe un correo válido, por ejemplo nombre@correo.com." : "",
    password: mode !== "forgot" && f.password.length < 8 ? "La contraseña debe tener al menos 8 caracteres." : "",
  };
  const go = async () => {
    setIntento(true);
    if (Object.values(errores).some(Boolean)) { setMsgOk(false); return setMsg("Revisa los campos marcados."); }
    setBusy(true); setMsg(""); setMsgOk(false);
    const url = mode === "login" ? "/api/account/session" : mode === "register" ? "/api/account/register" : "/api/account/forgot";
    const r = await fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(f) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setMsg(j.error ?? "Revisa los datos");
    if (mode === "forgot") { setMsgOk(true); return setMsg("Si el correo existe, te enviamos un enlace para restablecer la contraseña."); }
    location.reload();
  };
  const titles = { login: "Iniciar sesión", register: "Crear cuenta", forgot: "Recuperar contraseña" } as const;
  return (
    <div className="card p-6">
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1">
        {(["login", "register"] as const).map((m) => (
          <button key={m} onClick={() => { setMode(m); setMsg(""); setIntento(false); }} className={`flex-1 rounded-lg px-3 py-2 text-sm font-semibold transition ${mode === m ? "bg-white text-navy shadow-sm" : "text-slate-600 hover:text-navy"}`}>
            {m === "login" ? "Entrar" : "Crear cuenta"}
          </button>
        ))}
      </div>
      <h2 className="font-display text-xl font-bold text-navy">{titles[mode]}</h2>
      <div className="mt-4 space-y-3">
        {mode === "register" && (
          <>
            <label className="block">
              <input className={`input ${intento && errores.name ? "border-red-400 ring-2 ring-red-100" : ""}`} placeholder="Nombre completo" autoComplete="name" value={f.name} onChange={(e) => set("name", e.target.value)} aria-invalid={intento && !!errores.name} />
              {intento && errores.name && <span className="mt-1 block text-xs text-red-600">{errores.name}</span>}
            </label>
            <input className="input" placeholder="Teléfono (opcional)" autoComplete="tel" value={f.phone} onChange={(e) => set("phone", e.target.value)} />
          </>
        )}
        <label className="block">
          <input className={`input ${intento && errores.email ? "border-red-400 ring-2 ring-red-100" : ""}`} type="email" placeholder="Correo electrónico" autoComplete="email" value={f.email} onChange={(e) => set("email", e.target.value)} aria-invalid={intento && !!errores.email} />
          {intento && errores.email && <span className="mt-1 block text-xs text-red-600">{errores.email}</span>}
        </label>
        {mode !== "forgot" && (
          <div>
            <PasswordField placeholder="Contraseña (mínimo 8 caracteres)" autoComplete={mode === "login" ? "current-password" : "new-password"} value={f.password} onChange={(e) => set("password", e.target.value)} />
            {intento && errores.password && <span className="mt-1 block text-xs text-red-600">{errores.password}</span>}
          </div>
        )}
        {mode === "register" && (
          <label className="flex gap-2 text-xs text-slate-600"><input type="checkbox" checked={f.marketing} onChange={(e) => set("marketing", e.target.checked)} className="mt-0.5" />Quiero recibir novedades y ofertas por correo (puedes darte de baja cuando quieras).</label>
        )}
        <button disabled={busy} onClick={go} className="btn btn-primary w-full disabled:opacity-50">
          {mode === "login" ? "Entrar" : mode === "register" ? "Crear cuenta" : "Enviar enlace"}
        </button>
        {google && mode !== "forgot" && (
          <a href="/api/account/google/start" className="btn btn-ghost w-full">
            <Icon name="user" size={16} /> Continuar con Google
          </a>
        )}
        {msg && <p role="status" className={`rounded-lg p-3 text-sm ${msgOk ? "bg-emerald-50 text-emerald-800" : "bg-red-50 text-red-700"}`}>{msg}</p>}
      </div>
      <div className="mt-4 flex flex-wrap justify-between gap-2 text-sm">
        {mode !== "forgot" && <button onClick={() => { setMode("forgot"); setMsg(""); setIntento(false); }} className="text-slate-500 hover:text-navy">Olvidé mi contraseña</button>}
        {mode === "forgot" && <button onClick={() => { setMode("login"); setMsg(""); setIntento(false); }} className="text-[color:var(--color-action-deep)] hover:underline">Volver a iniciar sesión</button>}
      </div>
    </div>
  );
}
