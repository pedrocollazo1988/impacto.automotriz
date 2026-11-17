"use client";
import { useEffect, useState } from "react";

type Camp = { id: number; name: string; subject: string; html: string; status: string; segment?: { provinceIds?: number[]; tags?: string[] }; _count?: { sends: number } };
const post = (b: unknown) => fetch("/api/admin/campaigns", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(b) }).then((r) => r.json());

export default function CampaignsAdmin() {
  const [list, setList] = useState<Camp[]>([]); const [provs, setProvs] = useState<{ id: number; name: string }[]>([]);
  const [f, setF] = useState({ id: 0, name: "", subject: "", html: "<h2>Hola {{nombre}}</h2><p>…</p>", provinceIds: [] as number[], tags: "" });
  const [msg, setMsg] = useState("");
  const load = () => fetch("/api/admin/campaigns").then((r) => r.json()).then(setList);
  useEffect(() => { load(); fetch("/api/geo").then((r) => r.json()).then(setProvs); }, []);

  const save = async () => {
    const r = await post({ action: "save", id: f.id || undefined, name: f.name, subject: f.subject, html: f.html, segment: { provinceIds: f.provinceIds, tags: f.tags.split(",").map((t) => t.trim()).filter(Boolean) } });
    if (r.id) setF((p) => ({ ...p, id: r.id })); setMsg(r.error ?? "Guardado"); load(); return r.id as number | undefined;
  };
  const act = async (action: string, extra: object = {}) => { const id = f.id || (await save()); if (!id) return; const r = await post({ action, id, ...extra }); setMsg(r.error ?? JSON.stringify(r)); load(); };
  const input = "w-full rounded border px-3 py-2 text-sm";

  return (
    <div className="grid gap-6 lg:grid-cols-2">
      <section className="space-y-3">
        <input className={input} placeholder="Nombre interno" value={f.name} onChange={(e) => setF({ ...f, name: e.target.value })} />
        <input className={input} placeholder="Asunto del correo" value={f.subject} onChange={(e) => setF({ ...f, subject: e.target.value })} />
        <textarea className={`${input} h-56 font-mono`} value={f.html} onChange={(e) => setF({ ...f, html: e.target.value })} />
        <select multiple className={`${input} h-28`} value={f.provinceIds.map(String)} onChange={(e) => setF({ ...f, provinceIds: [...e.target.selectedOptions].map((o) => Number(o.value)) })}>
          {provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <input className={input} placeholder="Etiquetas (coma): taller, mayorista…  — vacío = todos" value={f.tags} onChange={(e) => setF({ ...f, tags: e.target.value })} />
        <div className="flex flex-wrap gap-2">
          <button className="rounded border px-3 py-2" onClick={save}>Guardar borrador</button>
          <button className="rounded border px-3 py-2" onClick={() => act("preview")}>Ver destinatarios</button>
          <button className="rounded border px-3 py-2" onClick={() => { const to = prompt("Enviar prueba a:"); if (to) act("test", { to }); }}>Enviar prueba</button>
          <button className="rounded bg-[#14213d] px-3 py-2 text-white" onClick={() => confirm("¿Enviar a toda la audiencia?") && act("send")}>Enviar campaña</button>
        </div>
        <p className="text-sm text-slate-600">{msg}</p>
      </section>
      <section className="space-y-2">
        <h3 className="font-semibold">Campañas</h3>
        {list.map((c) => (
          <div key={c.id} className="flex justify-between rounded border p-3 text-sm">
            <span><b>{c.name}</b><br /><small>{c.subject}</small></span>
            <span className="text-right">{c.status}<br /><small>{c._count?.sends ?? 0} envíos</small>{c.status === "SENDING" && <button className="block text-red-600" onClick={() => post({ action: "cancel", id: c.id }).then(load)}>Cancelar</button>}</span>
          </div>))}
      </section>
    </div>
  );
}
