"use client";
import { Fragment, useState } from "react";
import Icon, { NOMBRES_ICONO } from "@/components/brand/Icon";
import { Field, inputCls, Modal } from "@/components/admin/ui";
import { grupoDe } from "@/lib/contenido-orden";
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
  const [subiendo, setSubiendo] = useState<string | null>(null);
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

  const subirImagen = async (key: string, i: number, campo: keyof Item, file: File) => {
    setSubiendo(`${key}-${i}`);
    setAviso(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo subir la imagen");
      cambiarItem(key, i, campo, d.url);
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "Error al subir la imagen" });
    } finally {
      setSubiendo(null);
    }
  };

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

  let grupoAnterior = "";
  return (
    <div className="space-y-3">
      <div className="adm-panel flex items-start gap-3 px-4 py-3 text-sm text-slate-600">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="info" size={16} /></span>
        <div>
          <p className="font-semibold text-navy">Cómo editar el contenido</p>
          <p className="mt-0.5 text-xs leading-relaxed">Los bloques están ordenados como aparecen en la web. Abre uno, cambia el texto y pulsa «Guardar». Si desmarcas «Visible en la web», la sección se oculta sin borrar lo escrito.</p>
        </div>
      </div>
      {aviso && (
        <div className={`adm-panel px-4 py-3 text-sm font-medium ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-600"}`} role="status">
          {aviso.texto}
        </div>
      )}

      {secciones.map((sec) => {
        const b = estado[sec.key];
        const activa = abierta === sec.key;
        const max = sec.maxItems ?? 30;
        const fijo = sec.key === "facturacion" || sec.key === "carrito-config";
        const camposItem = sec.camposItem ?? [];
        const grupo = grupoDe(sec);
        const nuevoGrupo = grupo !== grupoAnterior;
        grupoAnterior = grupo;
        return (
          <Fragment key={sec.key}>
            {nuevoGrupo && (
              <div className="flex items-center gap-3 px-1 pt-3 first:pt-0">
                <span className="font-mono text-[10px] font-semibold uppercase tracking-[0.2em] text-slate-400">{grupo}</span>
                <span className="h-px flex-1 bg-slate-200" />
              </div>
            )}
          <section className="adm-panel overflow-hidden">
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
                            <>
                              <input
                                className={inputCls}
                                placeholder={c.tipo === "imagen" ? "https://… o /media/archivo.jpg" : undefined}
                                value={(b as unknown as Record<string, string>)[c.key] ?? ""}
                                onChange={(e) => cambiar(sec.key, c.key as keyof Bloque, e.target.value)}
                              />
                              {c.tipo === "imagen" && (b as unknown as Record<string, string>)[c.key] && (
                                <img src={(b as unknown as Record<string, string>)[c.key]} alt="" className="mt-2 h-24 w-full max-w-xs rounded-lg border border-slate-200 object-cover" />
                              )}
                            </>
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
                          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{it.titulo || `Elemento ${i + 1}`}</span>
                          {!fijo && (
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
                          )}
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
                                  <>
                                    <input
                                      className={inputCls}
                                      placeholder={c.tipo === "imagen" ? "https://… o /media/archivo.jpg" : undefined}
                                      value={(it as Record<string, string | undefined>)[c.key] ?? ""}
                                      onChange={(e) => cambiarItem(sec.key, i, c.key as keyof Item, e.target.value)}
                                    />
                                    {c.tipo === "imagen" && (
                                      <>
                                        <label className="btn btn-ghost btn-sm mt-2 inline-flex cursor-pointer items-center gap-1">
                                          <Icon name={subiendo === `${sec.key}-${i}` ? "spinner" : "upload"} size={13} className={subiendo === `${sec.key}-${i}` ? "animate-spin" : ""} />
                                          Subir imagen
                                          <input type="file" accept="image/jpeg,image/png,image/webp" className="hidden" disabled={!!subiendo}
                                            onChange={(e) => { const f = e.target.files?.[0]; if (f) void subirImagen(sec.key, i, c.key as keyof Item, f); e.currentTarget.value = ""; }} />
                                        </label>
                                        {(it as Record<string, string | undefined>)[c.key] && (
                                          <img src={(it as Record<string, string | undefined>)[c.key]} alt="" className="mt-2 h-24 w-full max-w-xs rounded-lg border border-slate-200 object-cover" />
                                        )}
                                      </>
                                    )}
                                  </>
                                )}
                              </Field>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                    {!fijo && b.items.length < max && (
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
          </Fragment>
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
