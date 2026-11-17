"use client";
import { useCallback, useEffect, useState } from "react";

type U = { id: string; email: string; name: string; role: string; active: boolean; lastLoginAt: string | null };
const ROLES: [string, string][] = [["ADMIN", "Administrador (todo)"], ["MANAGER", "Gerente (todo salvo equipo)"], ["SALES", "Ventas (pedidos, cupones, reportes, reseñas, correo)"], ["WAREHOUSE", "Almacén (productos, pedidos, logística, archivos)"]];
export default function Equipo() {
  const [list, setList] = useState<U[]>([]); const [f, setF] = useState({ email: "", name: "", role: "SALES", password: "" }); const [msg, setMsg] = useState("");
  const load = useCallback(() => { fetch("/api/admin/team").then((r) => r.json()).then(setList); }, []); useEffect(load, [load]);
  const send = async (body: object) => { const r = await fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); setMsg(r.ok ? "Guardado" : j.error ?? "Revisa los datos"); if (r.ok) load(); return r.ok; };
  const i = "rounded border px-3 py-2 text-sm";
  return (
    <main className="mx-auto max-w-4xl space-y-6 p-6"><h1 className="text-2xl font-bold text-navy">Equipo y permisos</h1>
      <div className="flex flex-wrap gap-2"><input className={i} placeholder="Nombre" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /><input className={i} placeholder="Correo" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} />
        <select className={i} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select>
        <input className={i} type="password" placeholder="Contraseña inicial (10+)" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} />
        <button className="rounded bg-navy px-4 py-2 text-sm text-white" onClick={async () => { if (await send({ ...f, active: true })) setF({ email: "", name: "", role: "SALES", password: "" }); }}>Añadir</button></div>
      <p className="text-sm text-slate-600">{msg}</p>
      <table className="w-full text-sm"><thead className="text-left text-slate-500"><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Último acceso</th><th /></tr></thead>
        <tbody>{list.map((u) => <tr key={u.id} className={`border-t ${u.active ? "" : "text-slate-400"}`}><td className="py-2">{u.name}</td><td>{u.email}</td>
          <td><select className="rounded border px-2 py-1" value={u.role} onChange={(e) => send({ ...u, role: e.target.value })}>{ROLES.map(([v]) => <option key={v}>{v}</option>)}</select></td><td>{u.lastLoginAt?.slice(0, 16).replace("T", " ") ?? "—"}</td>
          <td className="space-x-3"><button className="text-navy underline" onClick={() => { const p = prompt("Nueva contraseña (10+ caracteres):"); if (p) send({ ...u, password: p }); }}>Cambiar clave</button><button className="text-red-600" onClick={() => send({ ...u, active: !u.active })}>{u.active ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table></main>);
}
