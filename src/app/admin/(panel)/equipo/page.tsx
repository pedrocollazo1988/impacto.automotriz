"use client";
import { useCallback, useEffect, useState } from "react";
import { PageHeader, Panel, PanelPad, EmptyState, Badge, inputCls, Modal } from "@/components/admin/ui";
import Icon from "@/components/brand/Icon";
import PasswordField from "@/components/PasswordField";
import { usePreferences } from "@/components/site/Preferences";

type U = { id: string; email: string; name: string; role: string; active: boolean; lastLoginAt: string | null };
export default function Equipo() {
  const { lang, t } = usePreferences();
  const ROLES: [string, string][] = [
    ["ADMIN", t("adm.equipo.roleAdmin")],
    ["MANAGER", t("adm.equipo.roleManager")],
    ["SALES", t("adm.equipo.roleSales")],
    ["WAREHOUSE", t("adm.equipo.roleWarehouse")],
  ];
  const ROLE_LABEL: Record<string, string> = { ADMIN: t("adm.equipo.roleAdminShort"), MANAGER: t("adm.equipo.roleManagerShort"), SALES: t("adm.equipo.roleSalesShort"), WAREHOUSE: t("adm.equipo.roleWarehouseShort") };
  const [list, setList] = useState<U[]>([]); const [f, setF] = useState({ email: "", name: "", role: "SALES", password: "" }); const [msg, setMsg] = useState("");
  const [pwFor, setPwFor] = useState<U | null>(null); const [pw, setPw] = useState("");
  const load = useCallback(() => { fetch("/api/admin/team").then((r) => r.json()).then(setList); }, []); useEffect(load, [load]);
  const send = async (body: object) => { const r = await fetch("/api/admin/team", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) }); const j = await r.json(); setMsg(r.ok ? t("adm.equipo.saved") : j.error ?? t("adm.equipo.errForm")); if (r.ok) load(); return r.ok; };
  return (
    <>
      <PageHeader title={t("adm.equipo.title")} subtitle={t("adm.equipo.subtitle")} />
      <PanelPad className="mb-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">{t("adm.equipo.name")}</span><input className={inputCls} placeholder={t("adm.equipo.namePlaceholder")} value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} /></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">{t("adm.equipo.email")}</span><input className={inputCls} placeholder={lang === "en" ? "you@email.com" : "persona@correo.com"} value={f.email} onChange={(e) => setF({ ...f, email: e.target.value })} /></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">{t("adm.equipo.role")}</span><select className={inputCls} value={f.role} onChange={(e) => setF({ ...f, role: e.target.value })}>{ROLES.map(([v, l]) => <option key={v} value={v}>{l}</option>)}</select></label>
          <label className="space-y-1"><span className="block text-xs font-semibold text-slate-600">{t("adm.equipo.initialPassword")}</span><PasswordField className="w-52" placeholder={t("adm.equipo.passwordPlaceholder")} autoComplete="new-password" value={f.password} onChange={(e) => setF({ ...f, password: e.target.value })} /></label>
          <button className="btn btn-primary" onClick={async () => { if (await send({ ...f, active: true })) setF({ email: "", name: "", role: "SALES", password: "" }); }}><Icon name="plus" size={14} /> {t("adm.equipo.add")}</button>
        </div>
        {msg && <p className="mt-3 text-sm text-slate-600">{msg}</p>}
      </PanelPad>
      <Panel>
        {!list.length ? <EmptyState icon="user" title={t("adm.equipo.emptyTitle")} hint={t("adm.equipo.emptyHint")} /> : (
          <div className="adm-scroll">
            <table className="adm-table"><thead><tr><th>{t("adm.equipo.name")}</th><th>{t("adm.equipo.email")}</th><th>{t("adm.equipo.role")}</th><th>{t("adm.equipo.lastLogin")}</th><th /></tr></thead>
              <tbody>{list.map((u) => <tr key={u.id} className={u.active ? "" : "text-slate-400"}><td className="font-medium">{u.name}{!u.active && <Badge tone="mute">{t("adm.equipo.inactive")}</Badge>}</td><td className="text-slate-500">{u.email}</td>
                <td><select className="input input-sm" value={u.role} onChange={(e) => send({ ...u, role: e.target.value })}>{ROLES.map(([v]) => <option key={v} value={v}>{ROLE_LABEL[v]}</option>)}</select></td><td className="whitespace-nowrap text-slate-500">{u.lastLoginAt?.slice(0, 16).replace("T", " ") ?? "—"}</td>
                <td className="whitespace-nowrap text-right"><button className="btn btn-quiet btn-xs" onClick={() => { setPwFor(u); setPw(""); }}><Icon name="shield" size={12} /> {t("adm.equipo.changePassword")}</button><button className={`btn btn-xs ${u.active ? "btn-danger" : "btn-ghost"}`} onClick={() => send({ ...u, active: !u.active })}><Icon name={u.active ? "close" : "check"} size={12} /> {u.active ? t("adm.equipo.deactivate") : t("adm.equipo.activate")}</button></td></tr>)}</tbody></table>
          </div>
        )}
      </Panel>
      <Modal open={!!pwFor} title={t("adm.equipo.passwordTitle").replace("{name}", pwFor?.name ?? "")} onClose={() => setPwFor(null)}>
        <label className="block space-y-1"><span className="text-xs font-semibold text-slate-600">{t("adm.equipo.newPassword")}</span>
          <PasswordField autoFocus autoComplete="new-password" value={pw} onChange={(e) => setPw(e.target.value)} onKeyDown={(e) => e.key === "Enter" && pw && pwFor && send({ ...pwFor, password: pw }).then((ok) => ok && setPwFor(null))} /></label>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setPwFor(null)}>{t("adm.equipo.cancel")}</button>
          <button className="btn btn-primary btn-sm" disabled={pw.length < 10} onClick={() => pwFor && send({ ...pwFor, password: pw }).then((ok) => ok && setPwFor(null))}>{t("adm.equipo.save")}</button>
        </div>
      </Modal>
    </>);
}
