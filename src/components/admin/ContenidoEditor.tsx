"use client";
import { useState } from "react";
import Icon, { NOMBRES_ICONO } from "@/components/brand/Icon";
import { Field, inputCls, Modal } from "@/components/admin/ui";
import type { Item, Seccion } from "@/lib/contenido";

type Bloque = { eyebrow: string; title: string; subtitle: string; items: Item[]; visible: boolean };
type Props = { secciones: Seccion[]; valores: Record<string, Bloque>; guardadas: string[] };

const ICONOS = NOMBRES_ICONO.filter((n) => n !== "spinner");

export default function ContenidoEditor({ secciones, valores, guardadas }: Props) {
  const [abierta, setAbierta] = useState<string | null>(secciones[0]?.key ?? null);
  const [estado, setEstado] = useState<Record<string, Bloque>>(valores);
  const [guardado, setGuardado] = useState<Record<string, boolean>>(
    Object.fromEntries(guardadas.map((k) => [k, true])),
  );
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<Seccion | null>(null);

  const cambiar = (key: string, campo: keyof Bloque, valor: unknown) =>
    setEstado((s) => ({ ...s, [key]: { ...s[key], [campo]: valor } }));

  const cambiarItem = (key: string, i: number, campo: keyof Item, valor: string) =>
    setEstado((s) => {
      const items = s[key].items.map((it, j) => (j === i ? { ...it, [campo]: valor } : it));
      return { ...s, [key]: { ...s[key], items } };
    });

  const mover = (key: string, i: number, delta: number) =>
    setEstado((s) => {
      const items = [...s[key].items];
      const j = i + delta;
      if (j < 0 || j >= items.length) return s;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...s, [key]: { ...s[key], items } };
    });

  const quitar = (key: string, i: number) =>
    setEstado((s) => ({ ...s, [key]: { ...s[key], items: s[key].items.filter((_, j) => j !== i) } }));

  const anadir = (key: string) =>
    setEstado((s) => ({ ...s, [key]: { ...s[key], items: [...s[key].items, { icono: "box", titulo: "", texto: "" }] } }));

  const guardar = async (sec: Seccion) => {
    setOcupado(sec.key);
    setAviso(null);
    try {
      const b = estado[sec.key];
      const r = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: sec.key, ...b }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar");
      setGuardado((g) => ({ ...g, [sec.key]: true }));
      setAviso({ tipo: "ok", texto: `«${sec.label}» guardado. La web ya lo muestra.` });
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "Error al guardar" });
    } finally {
      setOcupado(null);
    }
  };

  const restaurar = async (sec: Seccion) => {
    setConfirmar(null);
    setOcupado(sec.key);
    try {
      const r = await fetch(`/api/admin/content?key=${encodeURIComponent(sec.key)}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error ?? "No se pudo restaurar");
      setEstado((s) => ({
        ...s,
        [sec.key]: {
          eyebrow: sec.defecto.eyebrow ?? "",
          title: sec.defecto.title ?? "",
          subtitle: sec.defecto.subtitle ?? "",
          items: sec.defecto.items ?? [],
          visible: true,
        },
      }));
      setGuardado((g) => ({ ...g, [sec.key]: false }));
      setAviso({ tipo: "ok", texto: `«${sec.label}» vuelve al texto original.` });
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "Error al restaurar" });
    } finally {
      setOcupado(null);
    }
  };

  return (
    <div className="space-y-3">
      {aviso && (
        <div className={`adm-panel px-4 py-3 text-sm font-medium ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-600"}`} role="status">
          {aviso.texto}
        </div>
      )}

      {secciones.map((sec) => {
        const b = estado[sec.key];
        const activa = abierta === sec.key;
        const max = sec.maxItems ?? 30;
        const camposItem = sec.camposItem ?? [];
        return (
          <section key={sec.key} className="adm-panel overflow-hidden">
            <button
              type="button"
              onClick={() => setAbierta(activa ? null : sec.key)}
              aria-expanded={activa}
              className="flex w-full items-center gap-3 px-4 py-3.5 text-left transition hover:bg-slate-50"
            >
              <span className="grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]">
                <Icon name={guardado[sec.key] ? "check" : "info"} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold text-navy">{sec.label}</span>
                <span className="block truncate text-xs text-slate-500">{sec.descripcion}</span>
              </span>
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {sec.camposItem?.length ? `${b.items.length} elementos` : "bloque"}
              </span>
              <Icon name={activa ? "minus" : "plus"} size={16} className="shrink-0 text-slate-400" />
            </button>

            {activa && (
              <div className="space-y-4 border-t border-slate-100 px-4 py-4">
                {sec.campos.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sec.campos.map((c) => (
                      <div key={c.key} className={c.ancho ? "sm:col-span-2" : ""}>
                        <Field label={c.label}>
                          {c.tipo === "parrafo" ? (
                            <textarea
                              className={inputCls}
                              rows={3}
                              value={(b as unknown as Record<string, string>)[c.key] ?? ""}
                              onChange={(e) => cambiar(sec.key, c.key as keyof Bloque, e.target.value)}
                            />
                          ) : (
                            <input
                              className={inputCls}
                              value={(b as unknown as Record<string, string>)[c.key] ?? ""}
                              onChange={(e) => cambiar(sec.key, c.key as keyof Bloque, e.target.value)}
                            />
                          )}
                        </Field>
                      </div>
                    ))}
                  </div>
                )}

                {camposItem.length > 0 ? (
                  <div className="space-y-3">
                    {b.items.map((it, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">Elemento {i + 1}</span>
                          <div className="flex gap-1">
                            <button type="button" className="btn btn-quiet btn-xs" onClick={() => mover(sec.key, i, -1)} disabled={i === 0} aria-label="Subir">
                              <Icon name="chevronLeft" size={14} className="rotate-90" />
                            </button>
                            <button type="button" className="btn btn-quiet btn-xs" onClick={() => mover(sec.key, i, 1)} disabled={i === b.items.length - 1} aria-label="Bajar">
                              <Icon name="chevronRight" size={14} className="rotate-90" />
                            </button>
                            <button type="button" className="btn btn-quiet btn-xs text-red-600" onClick={() => quitar(sec.key, i)} aria-label="Quitar">
                              <Icon name="trash" size={14} />
                            </button>
                          </div>
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {camposItem.map((c) => (
                            <div key={c.key} className={c.ancho ? "sm:col-span-2" : ""}>
                              <Field label={c.label}>
                                {c.tipo === "icono" ? (
                                  <select
                                    className={inputCls}
                                    value={it.icono ?? ""}
                                    onChange={(e) => cambiarItem(sec.key, i, "icono", e.target.value)}
                                  >
                                    <option value="">Sin icono</option>
                                    {ICONOS.map((n) => <option key={n} value={n}>{n}</option>)}
                                  </select>
                                ) : c.tipo === "parrafo" ? (
                                  <textarea
                                    className={inputCls}
                                    rows={3}
                                    value={(it as Record<string, string | undefined>)[c.key] ?? ""}
                                    onChange={(e) => cambiarItem(sec.key, i, c.key as keyof Item, e.target.value)}
                                  />
                                ) : (
                                  <input
                                    className={inputCls}
                                    value={(it as Record<string, string | undefined>)[c.key] ?? ""}
                                    onChange={(e) => cambiarItem(sec.key, i, c.key as keyof Item, e.target.value)}
                                  />
                                )}
                              </Field>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {b.items.length < max && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => anadir(sec.key)}>
                        <Icon name="plus" size={15} /> Añadir elemento
                      </button>
                    )}
                  </div>
                ) : null}

                <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 pt-3">
                  <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
                    <input
                      type="checkbox"
                      checked={b.visible}
                      onChange={(e) => cambiar(sec.key, "visible", e.target.checked)}
                    />
                    Visible en la web
                  </label>
                  <div className="flex gap-2">
                    <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmar(sec)} disabled={!guardado[sec.key]}>
                      <Icon name="refresh" size={14} /> Texto original
                    </button>
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => guardar(sec)} disabled={ocupado === sec.key}>
                      {ocupado === sec.key ? "Guardando…" : "Guardar"}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
        );
      })}

      <Modal open={!!confirmar} title="Restaurar texto original" onClose={() => setConfirmar(null)}>
        <p className="text-sm text-slate-600">
          Se descartará lo que hayas escrito en «{confirmar?.label}» y volverá el texto con el que se diseñó la web.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmar(null)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={() => confirmar && restaurar(confirmar)}>Restaurar</button>
        </div>
      </Modal>
    </div>
  );
}
