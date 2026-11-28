"use client";
import { useCallback, useEffect, useRef, useState } from "react";
import { usePreferences } from "@/components/site/Preferences";

type Opt = { id: number; name: string };
type Rule = { id: number; municipalityId: number | null; available: boolean; feeUsd: string | null; etaMinDays: number | null; etaMaxDays: number | null };
type Method = Opt & { code: string; kind: string; description: string | null; active: boolean; sortOrder: number; baseFee: string | number; freeFromUsd: string | number | null; etaMinDays: number; etaMaxDays: number; requiresAddress: boolean; cashOnDelivery: boolean };
const api = async (url: string, method = "GET", body?: unknown, fallback = "") => {
  const r = await fetch(url, { method, cache: "no-store", headers: { "Content-Type": "application/json" }, body: body ? JSON.stringify(body) : undefined });
  const d = await r.json().catch(() => ({}));
  if (!r.ok) throw new Error(d.error ?? fallback);
  return d;
};
const aNumero = (v: string) => {
  const t = v.trim().replace(",", ".");
  if (t === "") return null;
  const n = Number(t);
  return Number.isFinite(n) ? n : NaN;
};

const TIPO_CLAVE: Record<string, string> = { HOME_DELIVERY: "adm.zonas.kindHome", STORE_PICKUP: "adm.zonas.kindPickup", COURIER: "adm.zonas.kindCourier", AGREED_POINT: "adm.zonas.kindAgreed" };

function BaseFeeRow({ m, onSave }: { m: Method; onSave: (id: number, base: string, free: string) => Promise<void> }) {
  const { t } = usePreferences();
  const [base, setBase] = useState(m.baseFee == null ? "" : String(m.baseFee));
  const [free, setFree] = useState(m.freeFromUsd == null ? "" : String(m.freeFromUsd));
  const [busy, setBusy] = useState(false);
  return (
    <div className="flex flex-wrap items-end gap-2 rounded-xl border border-slate-200 bg-slate-50/60 p-3">
      <div className="min-w-40 flex-1">
        <p className="text-sm font-semibold text-navy">{m.name}</p>
        <p className="text-[11px] text-slate-500">{TIPO_CLAVE[m.kind] ? t(TIPO_CLAVE[m.kind]) : m.kind}{m.active ? "" : t("adm.zonas.inactive")}</p>
      </div>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-slate-500">{t("adm.zonas.baseFee")}</span>
        <input className="input input-sm w-28" inputMode="decimal" placeholder="0" value={base} onChange={(e) => setBase(e.target.value)} />
      </label>
      <label className="block">
        <span className="mb-1 block text-[11px] font-semibold text-slate-500">{t("adm.zonas.freeFrom")}</span>
        <input className="input input-sm w-32" inputMode="decimal" placeholder={t("adm.zonas.optional")} value={free} onChange={(e) => setFree(e.target.value)} />
      </label>
      <button className="btn btn-primary btn-sm" disabled={busy} onClick={async () => { setBusy(true); await onSave(m.id, base, free); setBusy(false); }}>
        {busy ? t("adm.zonas.saving") : t("adm.zonas.save")}
      </button>
    </div>
  );
}


function RuleRow({ label, rule, mid, onSave, onRemove }: { label: string; rule?: Rule; mid: number | null; onSave: (mid: number | null, on: boolean, fee: string, eta: string) => void; onRemove: (id: number) => void }) {
  const { t } = usePreferences();
  const [on, setOn] = useState(rule?.available ?? false);
  const [fee, setFee] = useState(rule?.feeUsd ?? "");
  const [eta, setEta] = useState(rule?.etaMinDays != null ? `${rule.etaMinDays}-${rule.etaMaxDays ?? ""}` : "");
  return (
    <tr className={!rule && mid ? "text-slate-400" : ""}>
      <td className="font-medium">{label}{!rule && mid ? ` ${t("adm.zonas.inheritsProvince")}` : ""}</td>
      <td><input type="checkbox" checked={on} onChange={(e) => setOn(e.target.checked)} /></td>
      <td><input className="input input-sm w-24" placeholder={t("adm.zonas.feePlaceholder")} value={fee} onChange={(e) => setFee(e.target.value)} /></td>
      <td><input className="input input-sm w-20" placeholder={t("adm.zonas.etaPlaceholder")} value={eta} onChange={(e) => setEta(e.target.value)} /></td>
      <td className="space-x-2"><button className="btn btn-primary btn-xs" onClick={() => onSave(mid, on, String(fee), eta)}>{t("adm.zonas.save")}</button>
        {rule && <button className="text-red-600" onClick={() => onRemove(rule.id)}>{t("adm.zonas.remove")}</button>}</td>
    </tr>
  );
}


// Panel: por método y provincia, activar/desactivar y fijar tarifa por provincia completa o por municipio.
export default function ZoneRulesEditor() {
  const { t } = usePreferences();
  // `loadMethods` se memoiza sin dependencias: el ref evita que el traductor
  // (nueva referencia en cada render) dispare el efecto una y otra vez.
  const tRef = useRef(t);
  tRef.current = t;
  const [methods, setMethods] = useState<Method[]>([]); const [provs, setProvs] = useState<Opt[]>([]); const [muns, setMuns] = useState<Opt[]>([]);
  const [methodId, setMethodId] = useState(0); const [provId, setProvId] = useState(0); const [rules, setRules] = useState<Rule[]>([]); const [baseMsg, setBaseMsg] = useState("");
  const [testMun, setTestMun] = useState(0); const [testSubtotal, setTestSubtotal] = useState("100"); const [testMsg, setTestMsg] = useState("");

  const loadMethods = useCallback(() => api("/api/admin/logistica/methods", "GET", undefined, tRef.current("adm.zonas.saveChangeError")).then(setMethods).catch((e) => setBaseMsg(tRef.current("adm.zonas.loadMethodsError").replace("{error}", e instanceof Error ? e.message : tRef.current("adm.zonas.unknown")))), []);
  useEffect(() => { loadMethods(); api("/api/geo").then(setProvs).catch(() => setProvs([])); }, [loadMethods]);
  const load = useCallback(() => { if (methodId && provId) api(`/api/admin/logistica/rules?methodId=${methodId}&provinceId=${provId}`).then(setRules).catch(() => setRules([])); }, [methodId, provId]);
  useEffect(() => { load(); setMuns([]); setTestMun(0); if (provId) api(`/api/geo?provinceId=${provId}`).then(setMuns).catch(() => setMuns([])); }, [load, provId]);

  const save = async (municipalityId: number | null, available: boolean, feeUsd: string, eta?: string) => {
    try {
      const [min, max] = (eta ?? "").split("-").map((n) => (n.trim() ? Number(n) : null));
      const fee = aNumero(feeUsd);
      if (Number.isNaN(fee)) return setBaseMsg(t("adm.zonas.errZoneFee"));
      await api("/api/admin/logistica/rules", "POST", { methodId, provinceId: provId, municipalityIds: municipalityId ? [municipalityId] : undefined, available, feeUsd: fee, etaMinDays: min ?? null, etaMaxDays: max ?? min ?? null }, t("adm.zonas.saveChangeError"));
      setBaseMsg(t("adm.zonas.zoneSaved"));
      load();
    } catch (e) {
      setBaseMsg(`Error: ${e instanceof Error ? e.message : t("adm.zonas.errZoneSave")}`);
    }
  };
  const saveBase = async (id: number, base: string, free: string) => {
    const m = methods.find((x) => x.id === id);
    if (!m) return;
    const baseNum = aNumero(base) ?? 0;
    const freeNum = aNumero(free);
    if (Number.isNaN(baseNum) || baseNum < 0) return setBaseMsg(t("adm.zonas.errBaseFee"));
    if (Number.isNaN(freeNum)) return setBaseMsg(t("adm.zonas.errFreeFrom"));
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
      }, t("adm.zonas.saveChangeError"));
      setBaseMsg(t("adm.zonas.rateSavedFor").replace("{name}", m.name).replace("{amount}", `${baseNum.toFixed(2)} USD`));
      await loadMethods();
    } catch (e) {
      setBaseMsg(`Error: ${e instanceof Error ? e.message : t("adm.zonas.errRateSave")}`);
    }
  };
  const probar = async () => {
    if (!methodId || !testMun) return setTestMsg(t("adm.zonas.errChooseAll"));
    const subtotal = aNumero(testSubtotal);
    if (subtotal == null || Number.isNaN(subtotal) || subtotal < 0) return setTestMsg(t("adm.zonas.errSubtotal"));
    try {
      const q = await api("/api/shipping/quote", "POST", { municipalityId: testMun, subtotalUsd: subtotal }, t("adm.zonas.saveChangeError"));
      const x = q.find((i: { methodId: number }) => i.methodId === methodId);
      setTestMsg(x ? `${x.name}: ${x.available ? (x.feeUsd === 0 ? t("adm.zonas.free") : `${x.feeUsd.toFixed(2)} USD`) : t("adm.zonas.notAvailable").replace("{reason}", String(x.reason))}` : t("adm.zonas.errNoQuote"));
    } catch (e) {
      setTestMsg(`Error: ${e instanceof Error ? e.message : t("adm.zonas.errCheck")}`);
    }
  };
  const remove = async (id: number) => { await api(`/api/admin/logistica/rules?id=${id}`, "DELETE", undefined, t("adm.zonas.saveChangeError")); load(); };


  return (
    <section className="space-y-4">
      <div className="adm-panel p-4">
        <h2 className="font-display text-sm font-bold text-navy">{t("adm.zonas.baseTitle")}</h2>
        <p className="mt-1 text-xs text-slate-500">{t("adm.zonas.baseHint")}</p>
        <div className="mt-3 space-y-2">
          {methods.map((m) => <BaseFeeRow key={m.id} m={m} onSave={saveBase} />)}
          {!methods.length && <p className="text-sm text-slate-500">{t("adm.zonas.loadingMethods")}</p>}
        </div>
        {baseMsg && <p role="status" className={`mt-3 text-sm ${baseMsg.startsWith(t("adm.zonas.rateWord")) ? "text-emerald-700" : "text-red-600"}`}>{baseMsg}</p>}
      </div>

      <div className="flex flex-wrap gap-3">
        <select className="input input-sm" value={methodId} onChange={(e) => setMethodId(Number(e.target.value))}><option value={0}>{t("adm.zonas.methodOption")}</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
        <select className="input input-sm" value={provId} onChange={(e) => setProvId(Number(e.target.value))}><option value={0}>{t("adm.zonas.provinceOption")}</option>{provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
      </div>
      {methodId > 0 && provId > 0 ? (
        <div className="adm-panel">
          <div className="adm-scroll">
            <table className="adm-table"><thead><tr><th>{t("adm.zonas.colZone")}</th><th>{t("adm.zonas.colAvailable")}</th><th>{t("adm.zonas.colFee")}</th><th>{t("adm.zonas.colEta")}</th><th /></tr></thead>
              <tbody>
                <RuleRow label={t("adm.zonas.wholeProvince")} mid={null} rule={rules.find((r) => r.municipalityId === null)} onSave={save} onRemove={remove} />
                {muns.map((m) => <RuleRow key={m.id} label={m.name} mid={m.id} rule={rules.find((r) => r.municipalityId === m.id)} onSave={save} onRemove={remove} />)}
              </tbody></table>
          </div>
        </div>
      ) : (
        <div className="adm-panel adm-empty"><p className="font-semibold text-navy">{t("adm.zonas.chooseTitle")}</p><p className="text-sm">{t("adm.zonas.chooseHint")}</p></div>
      )}
        <p className="text-xs text-slate-500">{t("adm.zonas.priorityNote")}</p>

      <div className="adm-panel p-4">
        <h2 className="font-display text-sm font-bold text-navy">{t("adm.zonas.checkTitle")}</h2>
        <p className="mt-1 text-xs text-slate-500">{t("adm.zonas.checkHint")}</p>
        <div className="mt-3 flex flex-wrap items-end gap-2">
          <select className="input input-sm" value={methodId} onChange={(e) => setMethodId(Number(e.target.value))} aria-label={t("adm.zonas.ariaMethod")}><option value={0}>{t("adm.zonas.methodShort")}</option>{methods.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <select className="input input-sm" value={provId} onChange={(e) => setProvId(Number(e.target.value))} aria-label={t("adm.zonas.ariaProvince")}><option value={0}>{t("adm.zonas.provinceOption")}</option>{provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
          <select className="input input-sm" value={testMun} onChange={(e) => setTestMun(Number(e.target.value))} aria-label={t("adm.zonas.ariaMunicipality")}><option value={0}>{t("adm.zonas.municipalityOption")}</option>{muns.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
          <label className="text-xs font-semibold text-slate-600">{t("adm.zonas.subtotal")} <input className="input input-sm ml-1 w-24" inputMode="decimal" value={testSubtotal} onChange={(e) => setTestSubtotal(e.target.value)} /></label>
          <button type="button" className="btn btn-ghost btn-sm" onClick={probar}>{t("adm.zonas.check")}</button>
        </div>
        {testMsg && <p role="status" className={`mt-3 text-sm font-semibold ${testMsg.startsWith("Error") ? "text-red-600" : "text-emerald-700"}`}>{testMsg}</p>}
      </div>
    </section>
  );
}
