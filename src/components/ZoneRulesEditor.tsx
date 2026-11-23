"use client";
import { useCallback, useEffect, useState } from "react";

type Opt = { id: number; name: string };
type Rule = { id: number; municipalityId: number | null; available: boolean; feeUsd: string | null; etaMinDays: number | null; etaMaxDays: number | null };
const api = (url: string, method = "GET", body?: unknown) => fetch(url, { method, headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined }).then((r) => r.json());

// Panel: por método y provincia, activar/desactivar y fijar tarifa por provincia completa o por municipio.
export default function ZoneRulesEditor() {
  const [methods, setMethods] = useState<(Opt & { baseFee: string })[]>([]); const [provs, setProvs] = useState<Opt[]>([]); const [muns, setMuns] = useState<Opt[]>([]);
  const [methodId, setMethodId] = useState(0); const [provId, setProvId] = useState(0); const [rules, setRules] = useState<Rule[]>([]);

  useEffect(() => { api("/api/admin/logistica/methods").then(setMethods); api("/api/geo").then(setProvs); }, []);
  const load = useCallback(() => { if (methodId && provId) api(`/api/admin/logistica/rules?methodId=${methodId}&provinceId=${provId}`).then(setRules); }, [methodId, provId]);
  useEffect(() => { load(); setMuns([]); if (provId) api(`/api/geo?provinceId=${provId}`).then(setMuns); }, [load, provId]);

  const save = async (municipalityId: number | null, available: boolean, feeUsd: string, eta?: string) => {
    const [min, max] = (eta ?? "").split("-").map((n) => (n.trim() ? Number(n) : null));
    await api("/api/admin/logistica/rules", "POST", { methodId, provinceId: provId, municipalityIds: municipalityId ? [municipalityId] : undefined, available, feeUsd: feeUsd === "" ? null : Number(feeUsd), etaMinDays: min ?? null, etaMaxDays: max ?? min ?? null });
    load();
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
