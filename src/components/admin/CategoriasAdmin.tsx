"use client";
import { useState } from "react";
import Icon, { NOMBRES_ICONO } from "@/components/brand/Icon";
import { EmptyState, Field, inputCls, Modal, PageHeader, Panel } from "@/components/admin/ui";

type Categoria = {
  id: number;
  name: string;
  slug: string;
  description: string;
  icon: string;
  position: number;
  visible: boolean;
  _count: { products: number };
};

const ICONOS = NOMBRES_ICONO.filter((n) => n !== "spinner");
const vacia = { id: undefined as number | undefined, name: "", description: "", icon: "box", position: 0, visible: true };

export default function CategoriasAdmin({ iniciales }: { iniciales: Categoria[] }) {
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
      if (!r.ok) throw new Error(d.error ?? "No se pudo guardar");
      await recargar();
      setEditando(null);
      setAviso({ tipo: "ok", texto: "Categoría guardada." });
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "Error al guardar" });
    } finally { setOcupado(false); }
  };

  const borrar = async () => {
    if (!borrando) return;
    setOcupado(true); setAviso(null);
    try {
      const r = await fetch(`/api/admin/categories?id=${borrando.id}`, { method: "DELETE" });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error ?? "No se pudo borrar");
      await recargar();
      setAviso({ tipo: "ok", texto: `«${borrando.name}» eliminada.` });
    } catch (e) {
      setAviso({ tipo: "error", texto: e instanceof Error ? e.message : "Error al borrar" });
    } finally { setBorrando(null); setOcupado(false); }
  };

  return (
    <>
      <PageHeader
        title="Categorías"
        subtitle="Ordenan la portada y el catálogo. El nombre genera la dirección /catalogo?categoria=…"
        actions={<button className="btn btn-primary btn-sm" onClick={() => setEditando({ ...vacia, position: cats.length })}><Icon name="plus" size={15} /> Nueva categoría</button>}
      />

      {aviso && (
        <div className={`adm-panel mb-4 px-4 py-3 text-sm font-medium ${aviso.tipo === "ok" ? "text-emerald-700" : "text-red-600"}`} role="status">
          {aviso.texto}
        </div>
      )}

      <Panel>
        {cats.length === 0 ? (
          <EmptyState icon="grid" title="Aún no hay categorías" hint="Crea la primera para organizar el catálogo." />
        ) : (
          <table className="adm-table w-full">
            <thead>
              <tr>
                <th className="w-10"></th>
                <th>Nombre</th>
                <th className="hidden sm:table-cell">Descripción</th>
                <th className="w-24 text-right">Productos</th>
                <th className="w-20 text-right">Orden</th>
                <th className="w-24">Estado</th>
                <th className="w-24 text-right">Acciones</th>
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
                    <span className={`badge badge-${c.visible || c._count.products > 0 ? "ok" : "mute"}`}>{c.visible || c._count.products > 0 ? "Visible" : "Oculta"}</span>
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <button className="btn btn-quiet btn-xs" onClick={() => setEditando({ id: c.id, name: c.name, description: c.description, icon: c.icon, position: c.position, visible: c.visible })} aria-label={`Editar ${c.name}`}>
                        <Icon name="edit" size={14} />
                      </button>
                      <button className="btn btn-quiet btn-xs text-red-600" onClick={() => setBorrando(c)} aria-label={`Borrar ${c.name}`}>
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

      <Modal open={!!editando} title={editando?.id ? "Editar categoría" : "Nueva categoría"} onClose={() => setEditando(null)}>
        {editando && (
          <div className="space-y-3">
            <Field label="Nombre">
              <input className={inputCls} value={editando.name} onChange={(e) => setEditando({ ...editando, name: e.target.value })} />
            </Field>
            <Field label="Descripción" hint="Opcional. Aparece bajo el nombre en la portada.">
              <textarea className={inputCls} rows={2} value={editando.description} onChange={(e) => setEditando({ ...editando, description: e.target.value })} />
            </Field>
            <div className="grid grid-cols-2 gap-3">
              <Field label="Icono">
                <select className={inputCls} value={editando.icon} onChange={(e) => setEditando({ ...editando, icon: e.target.value })}>
                  {ICONOS.map((n) => <option key={n} value={n}>{n}</option>)}
                </select>
              </Field>
              <Field label="Orden" hint="Menor va primero.">
                <input type="number" className={inputCls} value={editando.position} onChange={(e) => setEditando({ ...editando, position: Number(e.target.value) || 0 })} />
              </Field>
            </div>
            <label className="flex items-center gap-2 text-xs font-semibold text-slate-600">
              <input type="checkbox" checked={editando.visible} onChange={(e) => setEditando({ ...editando, visible: e.target.checked })} />
              Visible en la tienda
            </label>
            <p className="text-[11px] text-slate-500">Una categoría con productos activos sigue apareciendo en el filtro del catálogo.</p>
            <div className="flex justify-end gap-2 pt-1">
              <button className="btn btn-ghost btn-sm" onClick={() => setEditando(null)}>Cancelar</button>
              <button className="btn btn-primary btn-sm" onClick={guardar} disabled={ocupado}>{ocupado ? "Guardando…" : "Guardar"}</button>
            </div>
          </div>
        )}
      </Modal>

      <Modal open={!!borrando} title="Borrar categoría" onClose={() => setBorrando(null)}>
        <p className="text-sm text-slate-600">
          ¿Seguro que quieres borrar «{borrando?.name}»? Esta acción no se puede deshacer.
        </p>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setBorrando(null)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" onClick={borrar} disabled={ocupado}>Borrar</button>
        </div>
      </Modal>
    </>
  );
}
