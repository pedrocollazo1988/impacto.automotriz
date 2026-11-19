"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, PanelPad, EmptyState, Badge, inputCls, Modal } from "@/components/admin/ui";
import Icon from "@/components/brand/Icon";

type U = { id: string; email: string; name: string; role: string; active: boolean; lastLoginAt: string | null };
const ROLES: [string, string][] = [["ADMIN", "Administrador (todo)"], ["MANAGER", "Gerente (todo salvo equipo)"], ["SALES", "Ventas (pedidos, cupones, reportes, reseñas, correo)"], ["WAREHOUSE", "Almacén (productos, pedidos, logística, archivos)"]];
const ROLE_LABEL: Record<string, string> = { ADMIN: "Administrador", MANAGER: "Gerente", SALES: "Ventas", WAREHOUSE: "Almacén" };
export default function Equipo() {
  const [list, setList] = useState<U[]>([]); const [f, setF] = useState({ email: "", name: "", role: "SALES", password: "" }); const [msg, setMsg] = useState("");
  const [pwFor, setPwFor] = useState<U | null>(null); const [pw, setPw] = useState("");
  const load = useCallback(() => { fetch("/api/admin/team").then((r) => r.json()).then(setList); }, []); useEffect(load, [load]);
  const send = async (body: object) => { const r = await fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); setMsg(r.ok ? "Guardado" : j.error ?? "Revisa los datos"); if (r.ok) load(); return r.ok; };
  return (
    <>
      <PageHeader title="Equipo y permisos" subtitle="Da de alta a tu personal y ajusta su rol" />
      <PanelPad className="mb-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Nombre</span><input className={inputCls} placeholder="Nombre completo" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Correo</span><input className={inputCls} placeholder="persona@correo.com" value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Rol</span><select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">Contraseña inicial</span><input className={inputCls} type="password" placeholder="10+ caracteres" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          <button className="btn btn-primary" onClick={async () => { if (await send({ ...f, active: true })) setF({ email: "", name: "", role: "SALES", password: "" }); }}><Icon name="plus" size={14} /> Añadir</button>
        </div>
        {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
      </PanelPad>
      <Panel>
        {!list.length ? <EmptyState icon="user" title="Sin personal" hint="Añade a tu primer colaborador arriba." /> : (
          <div className="adm-scroll">
            <table className="adm-table"><thead><tr><th>Nombre</th><th>Correo</th><th>Rol</th><th>Último acceso</th><th /></tr></thead>
              <tbody>{list.map((u) => <tr key={u.id} className={u.active ? "" : "text-slate-400"}><td className="font-medium">{u.name}{!u.active && <Badge tone="mute">Inactivo</Badge>}</td><td className="text-slate-500">{u.email}</td>
                <td><select className="input input-sm" value={u.role} onChange={(e) => send({ ...u, role: e.target.value })}>{ROLES.map(([v]) => <option key={v} value={v}>{ROLE_LABEL[v]}</option>)}</select></td><td className="whitespace-nowrap text-slate-500">{u.lastLoginAt?.slice(0, 16).replace("T", " ") ?? "—"}</td>
                <td className="whitespace-nowrap text-right"><button className="btn btn-quiet btn-xs" onClick={() => { setPwFor(u); setPw(""); }}><Icon name="shield" size={12} /> Cambiar clave</button><button className={`btn btn-xs ${u.active ? "btn-danger" : "btn-ghost"}`} onClick={() => send({ ...u, active: !u.active })}><Icon name={u.active ? "close" : "check"} size={12} /> {u.active ? "Desactivar" : "Activar"}</button></td></tr>)}</tbody></table>
          </div>
        )}
      </Panel>
      <Modal open={!!pwFor} title={`Cambiar clave · ${pwFor?.name ?? ""}`} onClose={() => setPwFor(null)}>
        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">Nueva contraseña (10+ caracteres)</span>
          <input className={inputCls} type="password" autoFocus value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pw && pwFor && send({ ...pwFor, password: pw }).then((ok) => ok && setPwFor(null))} /></label>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setPwFor(null)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={pw.length < 10} onClick={() => pwFor && send({ ...pwFor, password: pw }).then((ok) => ok && setPwFor(null))}>Guardar</button>
        </div>
      </Modal>
    </>);
}
