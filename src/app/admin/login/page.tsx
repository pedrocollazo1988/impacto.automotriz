"use client";
import { useState } from "react";
export default function Login() {
  const [e, setE] = useState(""); const [p, setP] = useState(""); const [err, setErr] = useState("");
  return (
    <main className="mx-auto mt-24 max-w-sm space-y-3 p-6"><h1 className="text-xl font-bold text-navy">Panel de administración</h1>
      <input type="email" className="w-full rounded border px-3 py-2" placeholder="Correo" value={e} onChange={(x) => setE(x.target.value)} />
      <input type="password" className="w-full rounded border px-3 py-2" placeholder="Clave" value={p} onChange={(e) => setP(e.target.value)} onKeyDown={(e) => e.key === "Enter" && (document.getElementById("go") as HTMLButtonElement).click()} />
      <button id="go" className="w-full rounded bg-navy py-2 font-semibold text-white" onClick={async () => { const r = await fetch("/api/admin/login", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ email: e, password: p }) }); if (r.ok) location.href = "/admin"; else setErr((await r.json()).error); }}>Entrar</button>
      {err && <p className="text-sm text-red-600">{err}</p>}</main>);
}
