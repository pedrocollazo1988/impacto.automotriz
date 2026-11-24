"use client";
import { useCallback, useEffect, useState } from "react";

type Opt = { id: number; name: string };
type Rule = { id: number; municipalityId: number | null; available: boolean; feeUsd: string | null; etaMinDays: number | null; etaMaxDays: number | null };
type Method = Opt & { code: string; kind: string; description: string | null; active: boolean; sortOrder: number; baseFee: string | number; freeFromUsd: string | number | null; etaMinDays: number; etaMaxDays: number; requiresAddress: boolean; cashOnDelivery: boolean };
const api = async (url: string, method = "GET", body?: unknown) => {
  const r = await fetch(url, { method, cache: "no-store", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? "No se pudo guardar el cambio");
  return d;
};
const aNumero = (v: string) => {
  const t = v.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};

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
  const [testMun, setTestMun] = useState(0); const [testSubtotal, setTestSubtotal] = useState("100"); const [testMsg, setTestMsg] = useState("");

  const loadMethods = useCallback(() => api("/api/admin/logistica/methods").then(setMethods).catch((e) => setBaseMsg(`Error al cargar los métodos: ${e instanceof Error ? e.message : "desconocido"}`)), []);
  useEffect(() => { loadMethods(); api("/api/geo").then(setProvs).catch(() => setProvs([])); }, [loadMethods]);
  const load = useCallback(() => { if (methodId && provId) api(`/api/admin/logistica/rules?methodId=${methodId}&provinceId=${provId}`).then(setRules).catch(() => setRules([])); }, [methodId, provId]);
  useEffect(() => { load(); setMuns([]); setTestMun(0); if (provId) api(`/api/geo?provinceId=${provId}`).then(setMuns).catch(() => setMuns([])); }, [load, provId]);

  const save = async (municipalityId: number | null, available: boolean, feeUsd: string, eta?: string) => {
    try {
      const [min, max] = (eta ?? "").split("-").map((n) => (n.trim() ? Number(n) : null));
      const fee = aNumero(feeUsd);
      if (Number.isNaN(fee)) return setBaseMsg("La tarifa de la zona debe ser un número. Puedes usar coma o punto decimal.");
      await api("/api/admin/logistica/rules", "POST", { methodId, provinceId: provId, municipalityIds: municipalityId ? [municipalityId] : undefined, available, feeUsd: fee, etaMinDays: min ?? null, etaMaxDays: max ?? min ?? null });
      setBaseMsg("Tarifa de la zona guardada.");
      load();
    } catch (e) {
      setBaseMsg(`Error: ${e instanceof Error ? e.message : "no se pudo guardar la zona"}`);
    }
  };
  const saveBase = async (id: number, base: string, free: string) => {
    const m = methods.find((x) => x.id === id);
    if (!m) return;
    const baseNum = aNumero(base) ?? 0;
    const freeNum = aNumero(free);
    if (Number.isNaN(baseNum) || baseNum < 0) return setBaseMsg("La tarifa base debe ser un número igual o mayor que 0. Puedes usar coma o punto decimal.");
    if (Number.isNaN(freeNum)) return setBaseMsg("«Gratis desde» debe ser un número igual o mayor que 0.");
    setBaseMsg("");
    try {
      // Se envían solo los campos del método: así un campo nuevo o una fecha
      // del listado no rompen la validación del servidor.
      await api("/api/admin/logistica/methods", "POST", {
        id: m.id, code: m.code, name: m.name, kind: m.kind, description: m.description,
        active: m.active, sortOrder: m.sortOrder, baseFee: baseNum,
        // 0 o vacío significan «sin umbral», no envío gratis desde 0.
        freeFromUsd: freeNum != null && freeNum > 0 ? freeNum : null,
        etaMinDays: m.etaMinDays, etaMaxDays: m.etaMaxDays,
        requiresAddress: m.requiresAddress, cashOnDelivery: m.cashOnDelivery,
      });
      setBaseMsg(`Tarifa de «${m.name}» guardada: ${baseNum.toFixed(2)} USD.`);
      await loadMethods();
    } catch (e) {
      setBaseMsg(`Error: ${e instanceof Error ? e.message : "no se pudo guardar la tarifa"}`);
    }
  };
  const probar = async () => {
    if (!methodId || !testMun) return setTestMsg("Elige método, provincia y municipio.");
    const subtotal = aNumero(testSubtotal);
    if (subtotal == null || Number.isNaN(subtotal) || subtotal < 0) return setTestMsg("El subtotal debe ser un número igual o mayor que 0.");
    try {
      const q = await api("/api/shipping/quote", "POST", { municipalityId: testMun, subtotalUsd: subtotal });
      const x = q.find((i: { methodId: number }) => i.methodId === methodId);
      setTestMsg(x ? `${x.name}: ${x.available ? (x.feeUsd === 0 ? "Gratis" : `${x.feeUsd.toFixed(2)} USD`) : `No disponible (${x.reason})`}` : "Ese método no aparece en la cotización.");
    } catch (e) {
      setTestMsg(`Error: ${e instanceof Error ? e.message : "no se pudo comprobar"}`);
    }
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

      <div className="adm-panel p-4">
        <h2 className="font-display text-sm font-bold text-navy">Comprobar el precio que verá el cliente</h2>
        <p className="mt-1 text-xs text-slate-500">Esta consulta usa la misma función que el checkout. Si aquí sale 0, el checkout también saldrá gratis.</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <select className="input input-sm" value={methodId} onChange={(e) => setMethodId(Number(e.target.value))} aria-label="Método para comprobar"><option value={0}>Método…</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <select className="input input-sm" value={provId} onChange={(e) => setProvId(Number(e.target.value))} aria-label="Provincia para comprobar"><option value={0}>Provincia…</option>{provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className="input input-sm" value={testMun} onChange={(e) => setTestMun(Number(e.target.value))} aria-label="Municipio para comprobar"><option value={0}>Municipio…</option>{muns.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <label className="text-xs font-semibold text-slate-600">Subtotal <input className="input input-sm ml-1 w-24" inputMode="decimal" value={testSubtotal} onChange={(e) => setTestSubtotal(e.target.value)} /></label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={probar}>Comprobar</button>
        </div>
        {testMsg && <p role="status" className={`mt-3 text-sm font-semibold ${testMsg.startsWith("Error") ? "text-red-600" : "text-emerald-700"}`}>{testMsg}</p>}
      </div>
    </section>
  );
}
