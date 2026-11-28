"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { PageHeader, Panel, PanelPad, EmptyState, Badge, Modal, inputCls, inputSmCls } from "@/components/admin/ui";
import { usePreferences } from "@/components/site/Preferences";

type Prod = { id: number; sku: string; name: string; stock: number };
type Pin = { id: number; number: number; x: number; y: number; svgId: string | null; label: string | null; product: Prod };
type Diagram = { id: number; title: string; image: string; notes: string | null; system: { id: number; slug: string; name: string }; pins: Pin[] };
type Vehicle = { id: number; slug: string; brand: string; model: string; version: string; diagrams: Diagram[] };

export default function DespieceAdmin() {
  const { t } = usePreferences();
  const [vehicles, setVehicles] = useState<Vehicle[]>([]);
  const [vSlug, setVSlug] = useState("");
  const [dIdx, setDIdx] = useState(0);
  const [products, setProducts] = useState<Prod[]>([]);
  const [sel, setSel] = useState<number | null>(null);
  const [pending, setPending] = useState<{ x: number; y: number } | null>(null);
  const [form, setForm] = useState({ productId: "", number: "", label: "", svgId: "" });
  const [err, setErr] = useState("");
  const [sembrando, setSembrando] = useState(false);
  const [busy, setBusy] = useState(false);
  const [dragging, setDragging] = useState<number | null>(null);
  const imgRef = useRef<HTMLDivElement | null>(null);

  const load = useCallback(async () => {
    try {
      const r = await fetch("/api/admin/despiece");
      if (!r.ok) {
        const j = await r.json().catch(() => ({}));
        setErr(j.error ?? `${t("adm.despiece.errLoad")} (HTTP ${r.status})`);
        return;
      }
      const d: Vehicle[] = await r.json();
      setVehicles(Array.isArray(d) ? d : []);
      setVSlug((s) => s || d[0]?.slug || "");
    } catch {
      setErr(t("adm.despiece.errConnection"));
    }
  }, []);
  useEffect(() => { load(); }, [load]);

  const sembrar = async () => {
    if (!confirm(t("adm.despiece.seedConfirm"))) return;
    setSembrando(true); setErr("");
    try {
      const r = await fetch("/api/admin/despiece/seed", { method: "POST" });
      const j = await r.json().catch(() => ({}));
      if (!r.ok) { setErr(j.error ?? `${t("adm.despiece.errLoad")} (HTTP ${r.status})`); return; }
      await load();
    } catch {
      setErr(t("adm.despiece.errConnection"));
    } finally {
      setSembrando(false);
    }
  };
  useEffect(() => {
    fetch("/api/admin/products?take=500")
      .then((r) => (r.ok ? r.json() : { items: [] }))
      .then((d) => setProducts(Array.isArray(d) ? d : (d.items ?? [])))
      .catch(() => {});
  }, []);

  const vehicle = vehicles.find((v) => v.slug === vSlug) ?? null;
  const diagram = vehicle?.diagrams[dIdx] ?? null;

  // Próximo número libre de la lámina: evita tener que llevar la cuenta a mano.
  const nextNumber = useMemo(() => {
    if (!diagram) return 1;
    const usados = new Set(diagram.pins.map((p) => p.number));
    let n = 1;
    while (usados.has(n)) n++;
    return n;
  }, [diagram]);

  const posFromEvent = (e: React.MouseEvent | MouseEvent) => {
    const el = imgRef.current;
    if (!el) return null;
    const r = el.getBoundingClientRect();
    const x = ((e.clientX - r.left) / r.width) * 100;
    const y = ((e.clientY - r.top) / r.height) * 100;
    if (x < 0 || x > 100 || y < 0 || y > 100) return null;
    return { x: Math.round(x * 100) / 100, y: Math.round(y * 100) / 100 };
  };

  const onClickImage = (e: React.MouseEvent) => {
    if (dragging != null) return;
    const p = posFromEvent(e);
    if (!p) return;
    setPending(p);
    setForm({ productId: "", number: String(nextNumber), label: "", svgId: "" });
    setErr("");
  };

  // Arrastrar un pin existente para recolocarlo sin borrarlo.
  useEffect(() => {
    if (dragging == null) return;
    const move = (e: MouseEvent) => {
      const p = posFromEvent(e);
      if (!p) return;
      setVehicles((vs) => vs.map((v) => ({
        ...v,
        diagrams: v.diagrams.map((d) => d.id !== diagram?.id ? d : {
          ...d, pins: d.pins.map((pin) => pin.id === dragging ? { ...pin, ...p } : pin),
        }),
      })));
    };
    const up = async (e: MouseEvent) => {
      const p = posFromEvent(e);
      const id = dragging;
      setDragging(null);
      if (!p) return;
      await fetch("/api/admin/despiece", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...p }) });
      load();
    };
    window.addEventListener("mousemove", move);
    window.addEventListener("mouseup", up);
    return () => { window.removeEventListener("mousemove", move); window.removeEventListener("mouseup", up); };
  }, [dragging, diagram?.id, load]);

  const guardarPin = async () => {
    if (!diagram) return;
    if (!pending || !form.productId) return setErr(t("adm.despiece.errChooseProduct"));
    setBusy(true);
    const r = await fetch("/api/admin/despiece", {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        diagramId: diagram.id, productId: Number(form.productId),
        number: Number(form.number) || nextNumber,
        x: pending.x, y: pending.y,
        label: form.label || null, svgId: form.svgId || null,
      }),
    });
    const j = await r.json();
    setBusy(false);
    if (!r.ok) return setErr(j.error ?? t("adm.despiece.errSave"));
    setPending(null); setErr(""); await load();
  };

  const borrarPin = async (id: number) => {
    await fetch(`/api/admin/despiece?id=${id}`, { method: "DELETE" });
    setSel(null); await load();
  };

  const moverNumero = async (pin: Pin, delta: number) => {
    const n = pin.number + delta;
    if (n < 1) return;
    const r = await fetch("/api/admin/despiece", { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id: pin.id, number: n }) });
    if (!r.ok) { const j = await r.json(); setErr(j.error ?? t("adm.despiece.errNumberTaken")); return; }
    setErr(""); await load();
  };

  const sinPines = diagram && diagram.pins.length === 0;

  return (
    <>
      <PageHeader
        title={t("adm.despiece.title")}
        subtitle={t("adm.despiece.subtitle")}
        actions={
          vehicle && (
            <Link href={`/despiece/${vehicle.slug}/${diagram?.system.slug ?? ""}`} target="_blank" className="btn btn-ghost btn-sm">
              <Icon name="search" size={14} /> {t("adm.despiece.viewStore")}
            </Link>
          )
        }
      />

      <PanelPad className="mb-4">
        <div className="flex flex-wrap items-end gap-2">
          <label className="space-y-1">
            <span className="block text-xs font-semibold text-slate-600">{t("adm.despiece.vehicle")}</span>
            <select className={inputCls} value={vSlug} onChange={(e) => { setVSlug(e.target.value); setDIdx(0); setSel(null); }}>
              {vehicles.map((v) => <option key={v.id} value={v.slug}>{v.brand} {v.model} · {v.version}</option>)}
            </select>
          </label>
          <label className="space-y-1">
            <span className="block text-xs font-semibold text-slate-600">{t("adm.despiece.systemSheet")}</span>
            <select className={inputCls} value={dIdx} onChange={(e) => { setDIdx(Number(e.target.value)); setSel(null); }}>
              {(vehicle?.diagrams ?? []).map((d, i) => <option key={d.id} value={i}>{d.system.name} ({t("adm.despiece.pinsCount").replace("{n}", String(d.pins.length))})</option>)}
            </select>
          </label>
          <p className="ml-auto flex items-center gap-1.5 text-xs text-slate-500">
            <Icon name="info" size={13} /> {t("adm.despiece.addPinHint")}
          </p>
        </div>
        {err && <p className="mt-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
      </PanelPad>

      {vehicles.length === 0 ? (
        <Panel>
          <EmptyState
            icon="layers"
            title={t("adm.despiece.noVehicles")}
            hint={t("adm.despiece.noVehiclesHint")}
          />
          <div className="flex justify-center pb-6">
            <button className="btn btn-primary btn-sm" disabled={sembrando} onClick={sembrar}>
              {sembrando ? t("adm.despiece.seedLoading") : t("adm.despiece.seedAction")}
            </button>
          </div>
        </Panel>
      ) : !diagram ? (
        <Panel><EmptyState icon="layers" title={t("adm.despiece.noSheets")} hint={t("adm.despiece.noSheetsHint")} /></Panel>
      ) : (
        <div className="grid gap-4 lg:grid-cols-12 lg:items-start">
          <Panel className="lg:col-span-8">
            <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
              <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400">{diagram.title}</p>
              <Badge tone={diagram.pins.length ? "ok" : "warn"}>{t("adm.despiece.pinsCount").replace("{n}", String(diagram.pins.length))}</Badge>
            </div>
            <div className="relative select-none bg-slate-50 p-2">
              <div
                ref={imgRef}
                onClick={onClickImage}
                className="relative w-full cursor-crosshair overflow-hidden rounded-lg bg-white"
                style={{ aspectRatio: "3 / 2" }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={diagram.image} alt={diagram.title} className="pointer-events-none h-full w-full object-contain" draggable={false} />
                {diagram.pins.map((p) => (
                  <button
                    key={p.id}
                    onClick={(e) => { e.stopPropagation(); setSel(p.id); }}
                    onMouseDown={(e) => { e.stopPropagation(); setDragging(p.id); }}
                    style={{ left: `${p.x}%`, top: `${p.y}%` }}
                    title={`${p.number} · ${p.product.name}`}
                    className={`absolute grid h-7 w-7 -translate-x-1/2 -translate-y-1/2 cursor-move place-items-center rounded-full text-[11px] font-bold shadow transition ${
                      sel === p.id ? "z-20 scale-125 bg-[color:var(--color-action-hi)] text-[color:var(--color-navy-deep)] ring-4 ring-[color:var(--color-action-hi)]/40"
                        : "z-10 bg-[color:var(--color-navy)] text-white hover:bg-[color:var(--color-action)]"
                    }`}
                  >
                    {p.number}
                  </button>
                ))}
                {pending && (
                  <span
                    style={{ left: `${pending.x}%`, top: `${pending.y}%` }}
                    className="pointer-events-none absolute z-30 grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-[color:var(--color-action-hi)] text-[11px] font-bold text-[color:var(--color-navy-deep)] ring-4 ring-[color:var(--color-action-hi)]/40"
                  >
                    +
                  </span>
                )}
              </div>
              {sinPines && (
                <p className="pointer-events-none absolute inset-0 grid place-items-center text-sm font-semibold text-slate-400">
                  {t("adm.despiece.firstPinHint")}
                </p>
              )}
            </div>
          </Panel>

          <div className="lg:col-span-4">
            <Panel>
              <div className="border-b border-slate-100 px-3 py-2">
                <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400">{t("adm.despiece.sheetPins")}</p>
              </div>
              {diagram.pins.length === 0 ? (
                <EmptyState icon="pin" title={t("adm.despiece.noPins")} hint={t("adm.despiece.noPinsHint")} />
              ) : (
                <ul className="max-h-[62vh] divide-y divide-slate-100 overflow-y-auto">
                  {diagram.pins.map((p) => (
                    <li key={p.id} className={`p-2.5 ${sel === p.id ? "bg-[color:var(--color-action-hi)]/10" : ""}`}>
                      <div className="flex items-start gap-2">
                        <span className="mt-0.5 grid h-6 w-6 shrink-0 place-items-center rounded-full bg-[color:var(--color-navy)] font-mono text-[11px] font-bold text-white">{p.number}</span>
                        <div className="min-w-0 flex-1">
                          <p className="truncate text-xs font-bold text-navy">{p.product.name}</p>
                          <p className="font-mono text-[10px] text-slate-400">{p.product.sku}</p>
                          <p className="font-mono text-[10px] text-slate-400">x {p.x}% · y {p.y}%</p>
                        </div>
                        <div className="flex shrink-0 flex-col gap-1">
                          <div className="flex gap-1">
                            <button onClick={() => moverNumero(p, -1)} className="grid h-5 w-5 place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label={t("adm.despiece.ariaLowerNumber")}>−</button>
                            <button onClick={() => moverNumero(p, 1)} className="grid h-5 w-5 place-items-center rounded border border-slate-200 text-slate-500 hover:bg-slate-50" aria-label={t("adm.despiece.ariaRaiseNumber")}>+</button>
                          </div>
                          <button onClick={() => borrarPin(p.id)} className="btn btn-danger btn-xs" aria-label={t("adm.despiece.ariaRemovePin")}>
                            <Icon name="trash" size={11} />
                          </button>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </Panel>
          </div>
        </div>
      )}

      <Modal open={!!pending} title={t("adm.despiece.newPinTitle")} onClose={() => setPending(null)}>
        {pending && (
          <div className="space-y-3">
            <p className="rounded-lg bg-slate-50 px-3 py-2 font-mono text-xs text-slate-500">
              {t("adm.despiece.position")}: x {pending.x}% · y {pending.y}%
            </p>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">{t("adm.despiece.product")}</span>
              <select className={inputCls} value={form.productId} onChange={(e) => setForm({ ...form, productId: e.target.value })}>
                <option value="">{t("adm.despiece.productPlaceholder")}</option>
                {products.map((p) => <option key={p.id} value={p.id}>{p.sku} — {p.name}</option>)}
              </select>
            </label>
            <div className="grid grid-cols-2 gap-2">
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-600">{t("adm.despiece.numberInDrawing")}</span>
                <input className={inputCls} type="number" min={1} value={form.number} onChange={(e) => setForm({ ...form, number: e.target.value })} />
              </label>
              <label className="block space-y-1">
                <span className="text-xs font-semibold text-slate-600">{t("adm.despiece.shortLabel")}</span>
                <input className={inputCls} placeholder={t("adm.despiece.labelPlaceholder")} value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} />
              </label>
            </div>
            <label className="block space-y-1">
              <span className="text-xs font-semibold text-slate-600">{t("adm.despiece.svgIdLabel")}</span>
              <input className={`${inputSmCls} w-full font-mono`} placeholder="parte-01" value={form.svgId} onChange={(e) => setForm({ ...form, svgId: e.target.value })} />
            </label>
            {err && <p className="rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">{err}</p>}
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn btn-ghost btn-sm" onClick={() => setPending(null)}>{t("adm.despiece.cancel")}</button>
              <button className="btn btn-primary btn-sm" disabled={busy} onClick={guardarPin}>{busy ? t("adm.despiece.saving") : t("adm.despiece.addPin")}</button>
            </div>
          </div>
        )}
      </Modal>
    </>
  );
}
