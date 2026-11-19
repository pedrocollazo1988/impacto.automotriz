"use client";
import { useEffect, useState } from "react";
import { Badge, EmptyState, Modal, inputCls } from "@/components/admin/ui";

type Camp = { id: number; name: string; subject: string; html: string; status: string; segment?: { provinceIds?: number[]; tags?: string[] }; _count?: { sends: number } };
const post = (b: unknown) => fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json());

const STATUS_TONE: Record<string, "ok" | "warn" | "info" | "mute"> = { SENT: "ok", SENDING: "info", DRAFT: "mute", CANCELED: "warn" };

export default function CampaignsAdmin() {
  const [list, setList] = useState<Camp[]>([]); const [provs, setProvs] = useState<{ id: number; name: string }[]>([]);
  const [f, setF] = useState({ id: 0, name: "", subject: "", html: "<h2>Hola {{nombre}}</h2><p>…</p>", provinceIds: [] as number[], tags: "" });
  const [msg, setMsg] = useState("");
  const [testTo, setTestTo] = useState<string | null>(null); const [sendConfirm, setSendConfirm] = useState(false);
  const load = () => fetch("/api/admin/campaigns").then((r) => r.json()).then(setList);
  useEffect(() => { load(); fetch("/api/geo").then((r) => r.json()).then(setProvs); }, []);

  const save = async () => {
    const r = await post({ action: "save", id: f.id || undefined, name: f.name, subject: f.subject, html: f.html, segment: { provinceIds: f.provinceIds, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean) } });
    if (r.id) setF((p) => ({ ...p, id: r.id })); setMsg(r.error ?? "Guardado"); load(); return r.id as number | undefined;
  };
  const act = async (action: string, extra: object = {}) => { const id = f.id || (await save()); if (!id) return; const r = await post({ action, id, ...extra }); setMsg(r.error ?? JSON.stringify(r)); load(); };

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="adm-panel adm-panel-pad space-y-3">
        <h2 className="font-semibold text-navy">Redactar campaña</h2>
        <input className={inputCls} placeholder="Nombre interno" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={inputCls} placeholder="Asunto del correo" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        <textarea className={`${inputCls} h-56 font-mono`} value={f.html} onChange={(e) => setF({ ...f, html: e.target.value })} />
        <select multiple className={`${inputCls} h-28`} value={f.provinceIds.map(String)} onChange={(e) => setF({ ...f, provinceIds: [...e.target.selectedOptions].map((o) => Number(o.value)) })}>
          {provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input className={inputCls} placeholder="Etiquetas (coma): taller, mayorista…  — vacío = todos" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
        <div className="flex flex-wrap gap-2">
          <button className="btn btn-ghost btn-sm" onClick={save}>Guardar borrador</button>
          <button className="btn btn-ghost btn-sm" onClick={() => act("preview")}>Ver destinatarios</button>
          <button className="btn btn-ghost btn-sm" onClick={() => { setTestTo(""); setMsg(""); }}>Enviar prueba</button>
          <button className="btn btn-primary btn-sm" onClick={() => setSendConfirm(true)}>Enviar campaña</button>
        </div>
        {msg && <p className="text-sm text-slate-600">{msg}</p>}
      </section>
      <section className="adm-panel">
        <div className="border-b border-slate-100 px-4 py-3"><h2 className="font-semibold text-navy">Campañas</h2></div>
        {!list.length ? <EmptyState icon="mail" title="Sin campañas" hint="Redacta la primera a la izquierda y guárdala." /> : (
          <ul className="divide-y divide-slate-100">
            {list.map((c) => (
              <li key={c.id} className="flex items-center justify-between gap-3 px-4 py-3 text-sm">
                <span className="min-w-0"><b className="block truncate text-navy">{c.name}</b><small className="block truncate text-slate-500">{c.subject}</small></span>
                <span className="flex shrink-0 items-center gap-2">
                  <Badge tone={STATUS_TONE[c.status] ?? "mute"}>{c.status}</Badge>
                  <small className="text-slate-500">{c._count?.sends ?? 0} envíos</small>
                  {c.status === "SENDING" && <button className="btn btn-danger btn-xs" onClick={() => post({ action: "cancel", id: c.id }).then(load)}>Cancelar</button>}
                </span>
              </li>))}
          </ul>
        )}
      </section>

      <Modal open={testTo !== null} title="Enviar prueba" onClose={() => setTestTo(null)}>
        <p className="mb-2 text-sm text-slate-600">Se enviará una copia de la campaña al correo indicado.</p>
        <input className={inputCls} autoFocus type="email" value={testTo ?? ""} onChange={(e) => setTestTo(e.target.value)} placeholder="correo@ejemplo.com"
          onKeyDown={(e) => e.key === "Enter" && testTo && act("test", { to: testTo }).then(() => setTestTo(null))} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setTestTo(null)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!testTo} onClick={() => act("test", { to: testTo }).then(() => setTestTo(null))}>Enviar</button>
        </div>
      </Modal>

      <Modal open={sendConfirm} title="Enviar campaña" onClose={() => setSendConfirm(false)}>
        <p className="mb-4 text-sm text-slate-600">Se enviará a toda la audiencia del segmento seleccionado. ¿Continuar?</p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setSendConfirm(false)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => act("send").then(() => setSendConfirm(false))}>Sí, enviar</button>
        </div>
      </Modal>
    </div>
  );
}
