"use client";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/site/Preferences";

type Opt = { id: number; name: string };
type Quote = {
  methodId: number; name: string; kind: string; description?: string | null; available: boolean; reason?: string;
  feeUsd: number; etaMinDays: number; etaMaxDays: number; requiresAddress: boolean;
  slots: { id: number; label: string }[];
  pickupPoints: { id: number; name: string; address: string; hours: string | null }[];
};
export type DeliveryChoice = {
  municipalityId: number; methodId: number; address?: string; reference?: string; recipientName: string; recipientPhone: string;
  recipientCi?: string; isGift: boolean; slotId?: number; scheduledDate?: string; pickupPointId?: number;
};

// Selector de entrega para el checkout: provincia → municipio → métodos disponibles → datos.
// onChange recibe la elección (null si está incompleta) y el costo de envío a mostrar.
// El costo final lo recalcula el servidor con buildOrderDelivery().
export default function DeliverySelector({ subtotalUsd, onChange }: { subtotalUsd: number; onChange: (c: DeliveryChoice | null, feeUsd: number, methodName?: string) => void }) {
  const { t } = usePreferences();
  const [provs, setProvs] = useState<Opt[]>([]); const [muns, setMuns] = useState<Opt[]>([]); const [quotes, setQuotes] = useState<Quote[]>([]);
  const [prov, setProv] = useState(""); const [mun, setMun] = useState(""); const [methodId, setMethodId] = useState<number>();
  const [f, setF] = useState({ address: "", reference: "", recipientName: "", recipientPhone: "", recipientCi: "", isGift: false, slotId: "", scheduledDate: "", pickupPointId: "" });
  const set = (k: keyof typeof f, v: string | boolean) => setF((p) => ({ ...p, [k]: v }));

  useEffect(() => { fetch("/api/geo").then((r) => r.json()).then(setProvs); }, []);
  useEffect(() => { setMun(""); setMuns([]); setQuotes([]); setMethodId(undefined); if (prov) fetch(`/api/geo?provinceId=${prov}`).then((r) => r.json()).then(setMuns); }, [prov]);
  useEffect(() => {
    setMethodId(undefined); setQuotes([]);
    if (!mun) return;
    fetch("/api/shipping/quote", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ municipalityId: Number(mun), subtotalUsd }) })
      .then((r) => r.json()).then(setQuotes);
  }, [mun, subtotalUsd]);

  const q = quotes.find((x) => x.methodId === methodId);
  const faltas = q ? [
    !f.recipientName.trim() ? t("delivery.missingName") : "",
    !f.recipientPhone.trim() ? t("delivery.missingPhone") : "",
    q.requiresAddress && !f.address.trim() ? t("delivery.missingAddress") : "",
    q.kind === "STORE_PICKUP" && !f.pickupPointId ? t("delivery.missingPickup") : "",
  ].filter(Boolean) : [];
  useEffect(() => {
    const ok = q && f.recipientName.trim().length > 1 && f.recipientPhone.trim().length > 5 &&
      (!q.requiresAddress || f.address.trim()) && (q.kind !== "STORE_PICKUP" || f.pickupPointId);
    onChange(ok ? {
      municipalityId: Number(mun), methodId: q!.methodId, address: f.address || undefined, reference: f.reference || undefined,
      recipientName: f.recipientName, recipientPhone: f.recipientPhone, recipientCi: f.recipientCi || undefined, isGift: f.isGift,
      slotId: f.slotId ? Number(f.slotId) : undefined, scheduledDate: f.scheduledDate || undefined, pickupPointId: f.pickupPointId ? Number(f.pickupPointId) : undefined,
    } : null, q?.feeUsd ?? 0, q?.name);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [q, f, mun]);

  const input = "input";
  return (
    <section className="space-y-4">
      <div className="grid gap-3 sm:grid-cols-2">
        <select className={input} value={prov} onChange={(e) => setProv(e.target.value)}><option value="">{t("delivery.province")}</option>{provs.map((p) => <option key={p.id} value={p.id}>{p.name}</option>)}</select>
        <select className={input} value={mun} onChange={(e) => setMun(e.target.value)} disabled={!muns.length}><option value="">{t("delivery.municipality")}</option>{muns.map((m) => <option key={m.id} value={m.id}>{m.name}</option>)}</select>
      </div>

      {quotes.map((x) => (
        <label key={x.methodId} className={`flex cursor-pointer gap-3 rounded-xl border p-3 ${x.available ? "border-slate-200 hover:border-slate-300" : "opacity-50"} ${methodId === x.methodId ? "border-[color:var(--color-action)] ring-2 ring-[color:var(--color-action)]/25 bg-[color:var(--color-action)]/5" : ""}`}>
          <input type="radio" name="m" disabled={!x.available} checked={methodId === x.methodId} onChange={() => setMethodId(x.methodId)} />
          <span className="flex-1"><b>{x.name}</b><br /><small className="text-slate-500">{x.available ? `${x.etaMinDays}–${x.etaMaxDays} ${t("delivery.days")}` : x.reason}</small></span>
          {x.available && <b>{x.feeUsd === 0 ? t("delivery.free") : `${x.feeUsd.toFixed(2)} USD`}</b>}
        </label>
      ))}

      {q && (
        <div className="space-y-3">
          {q.kind === "STORE_PICKUP" && (
            <select className={input} value={f.pickupPointId} onChange={(e) => set("pickupPointId", e.target.value)}>
              <option value="">{t("delivery.pickup")}</option>{q.pickupPoints.map((p) => <option key={p.id} value={p.id}>{p.name} — {p.address}{p.hours ? ` (${p.hours})` : ""}</option>)}
            </select>)}
          {q.requiresAddress && (<><input className={input} placeholder={t("delivery.address")} value={f.address} onChange={(e) => set("address", e.target.value)} />
            <input className={input} placeholder={t("delivery.reference")} value={f.reference} onChange={(e) => set("reference", e.target.value)} /></>)}
          {q.slots.length > 0 && (
            <div className="grid gap-3 sm:grid-cols-2">
              <input type="date" className={input} value={f.scheduledDate} onChange={(e) => set("scheduledDate", e.target.value)} />
              <select className={input} value={f.slotId} onChange={(e) => set("slotId", e.target.value)}><option value="">{t("delivery.slot")}</option>{q.slots.map((s) => <option key={s.id} value={s.id}>{s.label}</option>)}</select>
            </div>)}
          <label className="flex items-center gap-2 text-sm"><input type="checkbox" checked={f.isGift} onChange={(e) => set("isGift", e.target.checked)} /> {t("delivery.gift")}</label>
          <div className="grid gap-3 sm:grid-cols-3">
            <input className={input} placeholder={t("delivery.recipient")} value={f.recipientName} onChange={(e) => set("recipientName", e.target.value)} />
            <input className={input} placeholder={t("delivery.phone")} value={f.recipientPhone} onChange={(e) => set("recipientPhone", e.target.value)} />
            <input className={input} placeholder={t("delivery.ci")} value={f.recipientCi} onChange={(e) => set("recipientCi", e.target.value)} />
          </div>
                  </div>)}
          {q && faltas.length > 0 && (
            <p role="status" className="rounded-lg bg-amber-50 px-3 py-2 text-xs text-amber-800">
              {t("delivery.missing").replace("{list}", faltas.join(", "))}
            </p>
          )}
    </section>
  );
}
