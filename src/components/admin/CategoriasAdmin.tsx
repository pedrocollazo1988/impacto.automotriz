"use client";
import { useState } from "react";
import Icon, { NOMBRES_ICONO } from "@/components/brand/Icon";
import { EmptyState, Field, inputCls, Modal, PageHeader, Panel } from "@/components/admin/ui";
import { usePreferences } from "@/components/site/Preferences";

type Categoria = {
  id: number;
  name: string;
  nameEn: string | null;
  slug: string;
  description: string;
  descriptionEn: string | null;
  icon: string;
  position: number;
  visible: boolean;
  _count: { products: number };
};

const ICONOS = NOMBRES_ICONO.filter((n) => n !== "spinner");
const vacia = { id: undefined as number | undefined, name: "", nameEn: "", description: "", descriptionEn: "", icon: "box", position: 0, visible: true };

export default function CategoriasAdmin({ iniciales }: { iniciales: Categoria[] }) {
  const { t } = usePreferences();
  const [cats, setCats] = useState(iniciales);
  const [editando, setEditando] = useState<typeof vacia | null>(null);
  const [borrando, setBorrando] = useState<Categoria | null>(null);
  const [aviso, setAviso] = useState<{ tipo: "ok" | "error"; texto: string } | null>(null);
  const [ocupado, setOcupado] = useState(false);

  const recargar = async () => {
    const r = await fetch("/api/admin/categories");
    if (r.ok) setCats(await r.json());
  };

  const guardar = async () => {
    if (!editando) return;
    setOcupado(true); setAviso(null);
    try {
      const r = await fetch("/api/admin/categories", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(editando),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? t("adm.cat.errSave"));
      await recargar();
      setEditando(null);
      setAviso({ tipo: "ok", texto: t("adm.cat.saved") });
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : t("adm.cat.errSaving") });
    } finally { setOcupado(false); }
  };

  const borrar = async () => {
    if (!borrando) return;
    setOcupado(true); setAviso(null);
    try {
      const r = await fetch(`/api/admin/categories?id=${borrando.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? t("adm.cat.errDelete"));
      await recargar();
      setAviso({ tipo: "ok", texto: t("adm.cat.deleted").replace("{name}", borrando.name) });
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : t("adm.cat.errDeleting") });
    } finally { setBorrando(null); setOcupado(false); }
  };

  return (
    <>
      <PageHeader
        title={t("adm.cat.title")}
        subtitle={t("adm.cat.subtitle")}
        actions={<button className="btn btn-primary btn-sm" onClick={() => setEditando({ ...vacia, position: cats.length })}><Icon name="plus" size={15} /> {t("adm.cat.new")}</button>}
      />

      {aviso && (
        <div className={`adm-panel mb-4 px-4 py-3 text-sm font-medium ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-600"}`} role="status">
          {aviso.texto}
        </div>
      )}

      <Panel>
        {cats.length === 0 ? (
          <EmptyState icon="grid" title={t("adm.cat.emptyTitle")} hint={t("adm.cat.emptyHint")} />
        ) : (
          <table className="adm-table w-full">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>{t("adm.cat.name")}</th>
                <th className="hidden sm:table-cell">{t("adm.cat.description")}</th>
                <th className="w-24 text-right">{t("adm.cat.products")}</th>
                <th className="w-20 text-right">{t("adm.cat.order")}</th>
                <th className="w-24">{t("adm.cat.status")}</th>
                <th className="w-24 text-right">{t("adm.cat.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {cats.map((c) => (
                <tr key={c.id}>
                  <td><Icon name={c.icon || "box"} size={18} className="text-[color:var(--color-action-deep)]" /></td>
                  <td>
                    <span className="font-semibold text-navy">{c.name}</span>
                    <span className="block font-mono text-[10px] text-slate-400">/{c.slug}</span>
                  </td>
                  <td className="hidden max-w-[22rem] truncate text-sm text-slate-500 sm:table-cell">{c.description || "—"}</td>
                  <td className="text-right font-mono text-sm">{c._count.products}</td>
                  <td className="text-right font-mono text-sm">{c.position}</td>
                  <td>
                    <span className={`badge badge-${c.visible || c._count.products > 0 ? "ok" : "mute"}`}>{c.visible || c._count.products > 0 ? t("adm.cat.visible") : t("adm.cat.hidden")}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-quiet btn-xs" onClick={() => setEditando({ id: c.id, name: c.name, nameEn: c.nameEn ?? "", description: c.description, descriptionEn: c.descriptionEn ?? "", icon: c.icon, position: c.position, visible: c.visible })} aria-label={t("adm.cat.editAria").replace("{name}", c.name)}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-quiet btn-xs text-red-600" onClick={() => setBorrando(c)} aria-label={t("adm.cat.deleteAria").replace("{name}", c.name)}>
                        <Icon name="trash" size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Modal open={!!editando} title={editando?.id ? t("adm.cat.editTitle") : t("adm.cat.new")} onClose={() => setEditando(null)}>
        {editando && (
          <div className="space-y-3">
            <Field label={t("adm.cat.name")}>
              <input className={inputCls} value={editando.name} onChange={(e) => setEditando({ ...editando, name: e.target.value })} />
            </Field>
            <Field label={t("adm.cat.description")} hint={t("adm.cat.descriptionHint")}>
              <textarea className={inputCls} rows={2} value={editando.description} onChange={(e) => setEditando({ ...editando, description: e.target.value })} />
            </Field>

            <div className="rounded-xl border border-slate-200 p-3">
              <p className="mb-2 flex items-center gap-1.5 text-xs font-semibold text-navy"><Icon name="globe" size={13} /> English</p>
              <p className="mb-3 text-[11px] text-slate-500">{t("adm.contenido.langHintEn")}</p>
              <div className="space-y-3">
                <Field label={t("adm.cat.name")}>
                  <input className={inputCls} value={editando.nameEn} onChange={(e) => setEditando({ ...editando, nameEn: e.target.value })} />
                </Field>
                <Field label={t("adm.cat.description")}>
                  <textarea className={inputCls} rows={2} value={editando.descriptionEn} onChange={(e) => setEditando({ ...editando, descriptionEn: e.target.value })} />
                </Field>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-3">
              <Field label={t("adm.cat.icon")}>
                <select className={inputCls} value={editando.icon} onChange={(e) => setEditando({ ...editando, icon: e.target.value })}>
                  {ICONOS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label={t("adm.cat.order")} hint={t("adm.cat.orderHint")}>
                <input type="number" className={inputCls} value={editando.position} onChange={(e) => setEditando({ ...editando, position: Number(e.target.value) || 0 })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" checked={editando.visible} onChange={(e) => setEditando({ ...editando, visible: e.target.checked })} />
              {t("adm.cat.visibleStore")}
            </label>
            <p className="text-[11px] text-slate-500">{t("adm.cat.visibleNote")}</p>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>{t("adm.cat.cancel")}</button>
              <button className="btn btn-primary btn-sm" onClick={guardar} disabled={ocupado}>{ocupado ? t("adm.cat.saving") : t("adm.cat.save")}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!borrando} title={t("adm.cat.deleteTitle")} onClose={() => setBorrando(null)}>
        <p className="text-sm text-slate-600">
          {t("adm.cat.deleteConfirm").replace("{name}", borrando?.name ?? "")}
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setBorrando(null)}>{t("adm.cat.cancel")}</button>
          <button className="btn btn-primary btn-sm" onClick={borrar} disabled={ocupado}>{t("adm.cat.delete")}</button>
        </div>
      </Modal>
    </>
  );
}
