"use client";
import { useCallback, useEffect, useState } from "react";

type Opt = { id: number; name: string };
type Rule = { id: number; municipalityId: number | null; available: boolean; feeUsd: string | null; etaMinDays: number | null; etaMaxDays: number | null };
type Method = Opt & { code: string; kind: string; description: string | null; active: boolean; sortOrder: number; baseFee: string | number; freeFromUsd: string | number | null; etaMinDays: number; etaMaxDays: number; requiresAddress: boolean; cashOnDelivery: boolean };
const api = (url: string, method = "GET", body?: unknown) => fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());

const TIPO: Record<string, string> = { HOME_DELIVERY: "Domicilio", STORE_PICKUP: "Recogida", COURIER: "Mensajería", AGREED_POINT: "Punto acordado" };

function BaseFeeRow({ m, onSave }: { m: Method; onSave: (id: number, base: string, free: string) => Promise<void> }) {
  const [base, setBase] = useState(m.baseFee == null ? "" : String(m.baseFee));
  const [free, setFree] = useState(m.freeFromUsd == null ? "" : String(m.freeFromUsd));
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="min-w-40 flex-1">
        <p className="text-sm font-semibold text-navy">{m.name}</p>
        <p className="text-[11px] text-slate-500">{TIPO[m.kind] ?? m.kind}{m.active ? "" : " · desactivado"}</p>
      </div>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-slate-500">Tarifa base (USD)</span>
        <input className="input input-sm w-28" inputMode="decimal" placeholder="0" value={base} onChange={(e) => setBase(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-slate-500">Gratis desde (USD)</span>
        <input className="input input-sm w-32" inputMode="decimal" placeholder="Opcional" value={free} onChange={(e) => setFree(e.target.value)} />
      </label>
      <button className="btn btn-primary btn-sm" disabled={busy} onClick={async () => { setBusy(true); await onSave(m.id, base, free); setBusy(false); }}>
        {busy ? "Guardando…" : "Guardar"}
      </button>
    </div>
  );
}


// Panel: por método y provincia, activar/desactivar y fijar tarifa por provincia completa o por municipio.
export default function ZoneRulesEditor() {
  const [methods, setMethods] = useState<Method[]>([]); const [provs, setProvs] = useState<Opt[]>([]); const [muns, setMuns] = useState<Opt[]>([]);
  const [methodId, setMethodId] = useState(0); const [provId, setProvId] = useState(0); const [rules, setRules] = useState<Rule[]>([]); const [baseMsg, setBaseMsg] = useState("");

  const loadMethods = useCallback(() => api("/api/admin/logistica/methods").then(setMethods), []);
  useEffect(() => { loadMethods(); api("/api/geo").then(setProvs); }, [loadMethods]);
  const load = useCallback(() => { if (methodId && provId) api(`/api/admin/logistica/rules?methodId=${methodId}&provinceId=${provId}`).then(setRules); }, [methodId, provId]);
  useEffect(() => { load(); setMuns([]); if (provId) api(`/api/geo?provinceId=${provId}`).then(setMuns); }, [load, provId]);

  const save = async (municipalityId: number | null, available: boolean, feeUsd: string, eta?: string) => {
    const [min, max] = (eta ?? "").split("-").map((n) => (n.trim() ? Number(n) : null));
    await api("/api/admin/logistica/rules", "POST", { methodId, provinceId: provId, municipalityIds: municipalityId ? [municipalityId] : undefined, available, feeUsd: feeUsd === "" ? null : Number(feeUsd), etaMinDays: min ?? null, etaMaxDays: max ?? min ?? null });
    load();
  };
  const saveBase = async (id: number, base: string, free: string) => {
    const m = methods.find((x) => x.id === id);
    if (!m) return;
    const baseNum = base.trim() === "" ? 0 : Number(base);
    const freeNum = free.trim() === "" ? null : Number(free);
    if (!Number.isFinite(baseNum) || baseNum < 0) return setBaseMsg("La tarifa base debe ser un número igual o mayor que 0.");
    if (freeNum !== null && (!Number.isFinite(freeNum) || freeNum < 0)) return setBaseMsg("«Gratis desde» debe ser un número igual o mayor que 0.");
    setBaseMsg("");
    const r = await fetch("/api/admin/logistica/methods", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...m, baseFee: baseNum, freeFromUsd: freeNum }),
    });
    const d = await r.json().catch(() => ({}));
    if (!r.ok) return setBaseMsg(d.error ?? "No se pudo guardar la tarifa.");
    setBaseMsg(`Tarifa de «${m.name}» guardada.`);
    loadMethods();
  };
  const remove = async (id: number) => { await api(`/api/admin/logistica/rules?id=${id}`, "DELETE"); load(); };

  const Row = ({ label, rule, mid }: { label: string; rule?: Rule; mid: number | null }) => {
    const [on, setOn] = useState(rule?.available ?? false); const [fee, setFee] = useState(rule?.feeUsd ?? ""); const [eta, setEta] = useState(rule?.etaMinDays != null ? `${rule.etaMinDays}-${rule.etaMaxDays ?? ""}` : "");
    return (
      <tr className={!rule && mid ? "text-slate-400" : ""}>
        <td className="font-medium">{label}{!rule && mid ? " (hereda provincia)" : ""}</td>
        <td><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /></td>
        <td><input className="input input-sm w-24" placeholder="tarifa USD" value={fee} onChange={(e) => setFee(e.target.value)} /></td>
        <td><input className="input input-sm w-20" placeholder="días 1-3" value={eta} onChange={(e) => setEta(e.target.value)} /></td>
        <td className="space-x-2"><button className="btn btn-primary btn-xs" onClick={() => save(mid, on, String(fee), eta)}>Guardar</button>
          {rule && <button className="text-red-600" onClick={() => remove(rule.id)}>Quitar</button>}</td>
      </tr>
    );
  };

  return (
    <section className="space-y-4">
      <div className="adm-panel p-4">
        <h2 className="font-display text-sm font-bold text-navy">Tarifa base de cada método</h2>
        <p className="mt-1 text-xs text-slate-500">Es el precio que se cobra cuando no hay una regla para la provincia o municipio. Si la tarifa es 0, el checkout muestra «Gratis». «Gratis desde» permite liberar el envío a partir de un subtotal.</p>
        <div className="mt-3 space-y-2">
          {methods.map((m) => <BaseFeeRow key={`${m.id}-${m.baseFee}-${m.freeFromUsd}`} m={m} onSave={saveBase} />)}
          {!methods.length && <p className="text-sm text-slate-500">Cargando métodos de entrega…</p>}
        </div>
        {baseMsg && <p role="status" className={`mt-3 text-sm ${baseMsg.startsWith("Tarifa") ? "text-emerald-700" : "text-red-600"}`}>{baseMsg}</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input input-sm" value={methodId} onChange={(e) => setMethodId(Number(e.target.value))}><option value={0}>Método de entrega…</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <select className="input input-sm" value={provId} onChange={(e) => setProvId(Number(e.target.value))}><option value={0}>Provincia…</option>{provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      {methodId > 0 && provId > 0 ? (
        <div className="adm-panel">
          <div className="adm-scroll">
            <table className="adm-table"><thead><tr><th>Zona</th><th>Disponible</th><th>Tarifa</th><th>Plazo</th><th /></tr></thead>
              <tbody key={`${methodId}-${provId}-${rules.length}`}>
                <Row label="Toda la provincia" mid={null} rule={rules.find((r) => r.municipalityId === null)} />
                {muns.map((m) => <Row key={m.id} label={m.name} mid={m.id} rule={rules.find((r) => r.municipalityId === m.id)} />)}
              </tbody></table>
          </div>
        </div>
      ) : (
        <div className="adm-panel adm-empty"><p className="font-semibold text-navy">Elige un método y una provincia</p><p className="text-sm">Configura la tarifa y el plazo de entrega por zona.</p></div>
      )}
        <p className="text-xs text-slate-500">Un municipio con regla propia tiene prioridad sobre la regla de su provincia. Sin regla se usa la tarifa base del método; para bloquear una zona, crea una regla y desmarca Disponible.</p>
    </section>
  );
}
