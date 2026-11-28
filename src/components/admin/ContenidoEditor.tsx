"use client";
import { Fragment, useState } from "react";
import Icon, { NOMBRES_ICONO } from "@/components/brand/Icon";
import { Field, inputCls, Modal } from "@/components/admin/ui";
import { usePreferences } from "@/components/site/Preferences";
import { grupoDe } from "@/lib/contenido-orden";
import { panelTexto } from "@/lib/contenido-en";
import type { Bloque, Item, Seccion } from "@/lib/contenido";

type Idioma = "es" | "en";
type PorIdioma<T> = Record<Idioma, T>;
type Props = {
  secciones: Seccion[];
  valores: PorIdioma<Record<string, Bloque>>;
  defectos: PorIdioma<Record<string, Bloque>>;
  guardadas: PorIdioma<string[]>;
};

const ICONOS = NOMBRES_ICONO.filter((n) => n !== "spinner");
// «Español» e «English» se quedan en su propio idioma: son los nombres de las
// lenguas y se entienden igual desde cualquier interfaz.
const IDIOMAS: { code: Idioma; label: string }[] = [
  { code: "es", label: "Español" },
  { code: "en", label: "English" },
];

const marcar = (claves: string[]) => Object.fromEntries(claves.map((k) => [k, true]));

export default function ContenidoEditor({ secciones, valores, defectos, guardadas }: Props) {
  const { t, lang } = usePreferences();
  const [idioma, setIdioma] = useState<Idioma>("es");
  const [abierta, setAbierta] = useState<string | null>(secciones[0]?.key ?? null);
  const [estado, setEstado] = useState<PorIdioma<Record<string, Bloque>>>(valores);
  const [guardado, setGuardado] = useState<PorIdioma<Record<string, boolean>>>({
    es: marcar(guardadas.es),
    en: marcar(guardadas.en),
  });
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState<string | null>(null);
  const [subiendo, setSubiendo] = useState<string | null>(null);
  const [confirmar, setConfirmar] = useState<Seccion | null>(null);
  const [avanzado, setAvanzado] = useState(false);

  const nombreIdioma = IDIOMAS.find((i) => i.code === idioma)?.label ?? idioma;
  const delIdioma = estado[idioma];
  const guardadoEn = guardado[idioma];

  // Todo se edita sobre el idioma seleccionado: español e inglés no se pisan
  // porque cada uno vive en su propia fila (key + lang).
  const cambiar = (key: string, campo: keyof Bloque, valor: unknown) =>
    setEstado((s) => ({ ...s, [idioma]: { ...s[idioma], [key]: { ...s[idioma][key], [campo]: valor } } }));

  const cambiarItem = (key: string, i: number, campo: keyof Item, valor: string) =>
    setEstado((s) => {
      const items = s[idioma][key].items.map((it, j) => (j === i ? { ...it, [campo]: valor } : it));
      return { ...s, [idioma]: { ...s[idioma], [key]: { ...s[idioma][key], items } } };
    });

  const mover = (key: string, i: number, delta: number) =>
    setEstado((s) => {
      const items = [...s[idioma][key].items];
      const j = i + delta;
      if (j < 0 || j >= items.length) return s;
      [items[i], items[j]] = [items[j], items[i]];
      return { ...s, [idioma]: { ...s[idioma], [key]: { ...s[idioma][key], items } } };
    });

  const quitar = (key: string, i: number) =>
    setEstado((s) => ({
      ...s,
      [idioma]: { ...s[idioma], [key]: { ...s[idioma][key], items: s[idioma][key].items.filter((_, j) => j !== i) } },
    }));

  const subirImagen = async (key: string, i: number, campo: keyof Item, file: File) => {
    setSubiendo(`${key}-${i}`);
    setAviso(null);
    try {
      const fd = new FormData();
      fd.append("file", file);
      const r = await fetch("/api/admin/upload", { method: "POST", body: fd });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? t("adm.contenido.errUpload"));
      cambiarItem(key, i, campo, d.url);
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : t("adm.contenido.errUploadGeneric") });
    } finally {
      setSubiendo(null);
    }
  };

  const anadir = (key: string) => {
    const campos = secciones.find((sec) => sec.key === key)?.camposItem ?? [];
    const nuevo = Object.fromEntries(campos.map((c) => [c.key, c.tipo === "icono" ? "box" : ""])) as Item;
    setEstado((s) => ({
      ...s,
      [idioma]: { ...s[idioma], [key]: { ...s[idioma][key], items: [...s[idioma][key].items, nuevo] } },
    }));
  };

  const guardar = async (sec: Seccion) => {
    setOcupado(sec.key);
    setAviso(null);
    try {
      const b = estado[idioma][sec.key];
      const r = await fetch("/api/admin/content", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key: sec.key, lang: idioma, ...b }),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? t("adm.contenido.errSave"));
      setGuardado((g) => ({ ...g, [idioma]: { ...g[idioma], [sec.key]: true } }));
      setAviso({
        tipo: "ok",
        texto: t("adm.contenido.saved").replace("{label}", panelTexto(sec.label, lang)).replace("{lang}", nombreIdioma),
      });
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : t("adm.contenido.errSaveGeneric") });
    } finally {
      setOcupado(null);
    }
  };

  const restaurar = async (sec: Seccion) => {
    setConfirmar(null);
    setOcupado(sec.key);
    try {
      const r = await fetch(`/api/admin/content?key=${encodeURIComponent(sec.key)}&lang=${idioma}`, { method: "DELETE" });
      if (!r.ok) throw new Error((await r.json()).error ?? t("adm.contenido.errRestore"));
      // Vuelve al texto de fábrica de ese idioma (traducido si es inglés); el otro
      // idioma conserva lo que tenga guardado.
      setEstado((s) => ({ ...s, [idioma]: { ...s[idioma], [sec.key]: defectos[idioma][sec.key] } }));
      setGuardado((g) => ({ ...g, [idioma]: { ...g[idioma], [sec.key]: false } }));
      setAviso({
        tipo: "ok",
        texto: t("adm.contenido.restored").replace("{label}", panelTexto(sec.label, lang)).replace("{lang}", nombreIdioma),
      });
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : t("adm.contenido.errRestoreGeneric") });
    } finally {
      setOcupado(null);
    }
  };

  let grupoAnterior = "";
  return (
    <div className="space-y-3">
      <div className="adm-panel flex flex-wrap items-center gap-3 px-4 py-3">
        <span className="grid h-9 w-9 shrink-0 place-items-center rounded-lg bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]">
          <Icon name="globe" size={17} />
        </span>
        <div className="min-w-0 flex-1">
          <p className="text-sm font-semibold text-navy">{t("adm.contenido.langLabel")}</p>
          <p className="text-xs text-slate-500">
            {t("adm.contenido.langSaveHint")} · {idioma === "en" ? t("adm.contenido.langHintEn") : t("adm.contenido.langHintEs")}
          </p>
        </div>
        <div role="group" aria-label={t("adm.contenido.langLabel")} className="flex gap-1 rounded-xl bg-slate-100 p-1">
          {IDIOMAS.map((i) => (
            <button
              key={i.code}
              type="button"
              onClick={() => setIdioma(i.code)}
              aria-pressed={idioma === i.code}
              className={`btn btn-xs ${idioma === i.code ? "btn-primary" : "btn-quiet"}`}
            >
              {i.label}
            </button>
          ))}
        </div>
      </div>

      <div className="adm-panel flex items-start gap-3 px-4 py-3 text-sm text-slate-600">
        <span className="mt-0.5 grid h-8 w-8 shrink-0 place-items-center rounded-lg bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="info" size={16} /></span>
        <div className="min-w-0 flex-1">
          <p className="font-semibold text-navy">{t("adm.contenido.helpTitle")}</p>
          <p className="mt-0.5 text-xs leading-relaxed">
            {avanzado ? t("adm.contenido.helpAdvanced") : t("adm.contenido.helpSimple")}
          </p>
          <button type="button" onClick={() => setAvanzado((v) => !v)} className="btn btn-ghost btn-sm mt-2">
            <Icon name={avanzado ? "eye" : "wrench"} size={14} /> {avanzado ? t("adm.contenido.simpleView") : t("adm.contenido.advancedView")}
          </button>
        </div>
      </div>

      {aviso && (
        <div className={`adm-panel px-4 py-3 text-sm font-medium ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-600"}`} role="status">
          {aviso.texto}
        </div>
      )}

      {secciones.map((sec) => {
        if (!avanzado && (sec.key === "facturacion" || sec.key === "carrito-config")) return null;
        const b = delIdioma[sec.key];
        const activa = abierta === sec.key;
        const max = sec.maxItems ?? 30;
        const fijo = sec.key === "facturacion" || sec.key === "carrito-config";
        const camposItem = sec.camposItem ?? [];
        const grupo = grupoDe(sec, lang);
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
                <Icon name={guardadoEn[sec.key] ? "check" : "info"} size={16} />
              </span>
              <span className="min-w-0 flex-1">
                <span className="block font-display text-sm font-bold text-navy">{panelTexto(sec.label, lang)}</span>
                <span className="block truncate text-xs text-slate-500">{panelTexto(sec.descripcion, lang)}</span>
              </span>
              {!guardadoEn[sec.key] && (
                <span className="shrink-0 rounded-full bg-amber-100 px-2 py-0.5 font-mono text-[10px] uppercase tracking-wider text-amber-700">
                  {t("adm.contenido.notSaved")}
                </span>
              )}
              <span className="shrink-0 font-mono text-[10px] uppercase tracking-wider text-slate-400">
                {camposItem.length ? t("adm.contenido.itemsCount").replace("{count}", String(b.items.length)) : t("adm.contenido.block")}
              </span>
              <Icon name={activa ? "minus" : "plus"} size={16} className="shrink-0 text-slate-400" />
            </button>

            {activa && (
              <div className="space-y-4 border-t border-slate-100 px-4 py-4">
                <p className="flex items-center gap-2 text-xs font-semibold text-slate-500">
                  <Icon name="globe" size={13} />
                  {t("adm.contenido.editing").replace("{lang}", nombreIdioma)}
                </p>

                {sec.campos.length > 0 && (
                  <div className="grid gap-3 sm:grid-cols-2">
                    {sec.campos.map((c) => {
                      if (!avanzado && c.tipo === "icono") return null;
                      return (
                      <div key={c.key} className={c.ancho ? "sm:col-span-2" : ""}>
                        <Field label={panelTexto(c.label, lang)}>
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
                                placeholder={c.tipo === "imagen" ? t("adm.contenido.imagePlaceholder") : undefined}
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
                      );
                    })}
                  </div>
                )}

                {camposItem.length > 0 ? (
                  <div className="space-y-3">
                    {b.items.map((it, i) => (
                      <div key={i} className="rounded-xl border border-slate-200 bg-slate-50/60 p-3">
                        <div className="mb-2 flex items-center justify-between gap-2">
                          <span className="font-mono text-[10px] uppercase tracking-wider text-slate-400">{it.titulo || t("adm.contenido.element").replace("{n}", String(i + 1))}</span>
                          {!fijo && (
                            <div className="flex gap-1">
                              <button type="button" className="btn btn-quiet btn-xs" onClick={() => mover(sec.key, i, -1)} disabled={i === 0} aria-label={t("adm.contenido.ariaUp")}>
                                <Icon name="chevronLeft" size={14} className="rotate-90" />
                              </button>
                              <button type="button" className="btn btn-quiet btn-xs" onClick={() => mover(sec.key, i, 1)} disabled={i === b.items.length - 1} aria-label={t("adm.contenido.ariaDown")}>
                                <Icon name="chevronRight" size={14} className="rotate-90" />
                              </button>
                              <button type="button" className="btn btn-quiet btn-xs text-red-600" onClick={() => quitar(sec.key, i)} aria-label={t("adm.contenido.ariaRemove")}>
                                <Icon name="trash" size={14} />
                              </button>
                            </div>
                          )}
                        </div>
                        <div className="grid gap-2 sm:grid-cols-2">
                          {camposItem.map((c) => {
                            if (!avanzado && c.tipo === "icono") return null;
                            return (
                            <div key={c.key} className={c.ancho ? "sm:col-span-2" : ""}>
                              <Field label={panelTexto(c.label, lang)}>
                                {c.tipo === "icono" ? (
                                  <select
                                    className={inputCls}
                                    value={it.icono ?? ""}
                                    onChange={(e) => cambiarItem(sec.key, i, "icono", e.target.value)}
                                  >
                                    <option value="">{t("adm.contenido.noIcon")}</option>
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
                                      placeholder={c.tipo === "imagen" ? t("adm.contenido.imagePlaceholder") : undefined}
                                      value={(it as Record<string, string | undefined>)[c.key] ?? ""}
                                      onChange={(e) => cambiarItem(sec.key, i, c.key as keyof Item, e.target.value)}
                                    />
                                    {c.tipo === "imagen" && (
                                      <>
                                        <label className="btn btn-ghost btn-sm mt-2 inline-flex cursor-pointer items-center gap-1">
                                          <Icon name={subiendo === `${sec.key}-${i}` ? "spinner" : "upload"} size={13} className={subiendo === `${sec.key}-${i}` ? "animate-spin" : ""} />
                                          {t("adm.contenido.uploadImage")}
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
                            );
                          })}
                        </div>
                      </div>
                    ))}
                    {!fijo && b.items.length < max && (
                      <button type="button" className="btn btn-ghost btn-sm" onClick={() => anadir(sec.key)}>
                        <Icon name="plus" size={15} /> {t("adm.contenido.addItem")}
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
                    {avanzado ? t("adm.contenido.visibleOnSite") : t("adm.contenido.showSection")}
                  </label>
                  <div className="flex gap-2">
                    {avanzado && (
                      <button type="button" className="btn btn-quiet btn-sm" onClick={() => setConfirmar(sec)} disabled={!guardadoEn[sec.key]}>
                        <Icon name="refresh" size={14} /> {t("adm.contenido.originalText")}
                      </button>
                    )}
                    <button type="button" className="btn btn-primary btn-sm" onClick={() => guardar(sec)} disabled={ocupado === sec.key}>
                      {ocupado === sec.key ? t("adm.contenido.saving") : t("adm.contenido.save")}
                    </button>
                  </div>
                </div>
              </div>
            )}
          </section>
          </Fragment>
        );
      })}

      <Modal open={!!confirmar} title={t("adm.contenido.restoreTitle")} onClose={() => setConfirmar(null)}>
        <p className="text-sm text-slate-600">
          {t("adm.contenido.restoreBody").replace("{label}", confirmar?.label ?? "").replace("{lang}", nombreIdioma)}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmar(null)}>{t("adm.contenido.cancel")}</button>
          <button className="btn btn-primary btn-sm" onClick={() => confirmar && restaurar(confirmar)}>{t("adm.contenido.restore")}</button>
        </div>
      </Modal>
    </div>
  );
}
