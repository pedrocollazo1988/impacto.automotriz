"use client";
import { useDeferredValue, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";
import { Modal } from "@/components/admin/ui";
import { usePreferences } from "@/components/site/Preferences";
import { filtrarProductos, ordenarProductos, type ClaveOrden, type Direccion, type FilaProducto } from "@/lib/admin-sort";

type Props = { filas: FilaProducto[]; puedeEliminar: boolean };

const COLUMNAS: { clave: ClaveOrden; titulo: string; numerica?: boolean }[] = [
  { clave: "sku", titulo: "adm.prod.colSku" },
  { clave: "name", titulo: "adm.prod.colProduct" },
  { clave: "category", titulo: "adm.prod.colCategory" },
  { clave: "priceUsd", titulo: "adm.prod.colPrice", numerica: true },
  { clave: "stock", titulo: "adm.prod.stock", numerica: true },
];

// Chevron propio: el sprite no trae flecha y un "+"/"−" no se lee como orden.
function Flecha({ activa, arriba }: { activa: boolean; arriba: boolean }) {
  return (
    <svg viewBox="0 0 12 12" width="1em" height="1em" aria-hidden="true" className={`flex-none ${activa ? "text-navy" : "text-slate-300"}`}>
      <path d={arriba ? "M2.5 7.5 6 4l3.5 3.5" : "M2.5 4.5 6 8l3.5-3.5"} fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

export default function TablaProductos({ filas, puedeEliminar }: Props) {
  const { t } = usePreferences();
  const router = useRouter();
  const [consulta, setConsulta] = useState("");
  // El input responde al instante; filtrar y ordenar se hace con el valor diferido.
  const consultaDiferida = useDeferredValue(consulta);
  const [orden, setOrden] = useState<{ clave: ClaveOrden; direccion: Direccion }>({ clave: "stock", direccion: "asc" });
  const [aBorrar, setABorrar] = useState<FilaProducto | null>(null);
  const [borrando, setBorrando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [motivo, setMotivo] = useState("Sin existencias");
  const [detalle, setDetalle] = useState("");
  // Tras borrar, la fila desaparece al instante aunque `router.refresh()` tarde
  // en traer los datos nuevos (o los sirva de su caché).
  const [eliminados, setEliminados] = useState<Set<number>>(new Set());

  const base = useMemo(() => filas.filter((f) => !eliminados.has(f.id)), [filas, eliminados]);
  const visibles = useMemo(
    () => ordenarProductos(filtrarProductos(base, consultaDiferida), orden.clave, orden.direccion),
    [base, consultaDiferida, orden],
  );

  function alOrdenar(clave: ClaveOrden) {
    setOrden((o) => (o.clave === clave ? { clave, direccion: o.direccion === "asc" ? "desc" : "asc" } : { clave, direccion: "asc" }));
  }

  async function eliminar() {
    if (!aBorrar) return;
    const victima = aBorrar;
    setBorrando(true);
    setError(null);
    try {
      const qs = new URLSearchParams({ id: String(victima.id), motivo, detalle });
      const r = await fetch(`/api/admin/products?${qs}`, { method: "DELETE" });
      if (!r.ok) {
        const cuerpo = await r.json().catch(() => ({}));
        throw new Error(cuerpo.error || `${t("adm.prod.deleteFailed")} (${r.status})`);
      }
      setEliminados((s) => new Set(s).add(victima.id));
      setABorrar(null);
      router.refresh();
    } catch (e) {
      setError(e instanceof Error ? e.message : t("adm.prod.deleteFailed"));
    } finally {
      setBorrando(false);
    }
  }

  return (
    <>
      <div className="adm-toolbar mb-3">
        <div className="relative flex-1 sm:max-w-xs">
          <Icon name="search" size={15} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="search"
            value={consulta}
            onChange={(e) => setConsulta(e.target.value)}
            placeholder={t("adm.prod.searchPlaceholder")}
            aria-label={t("adm.prod.searchLabel")}
            className="input input-sm w-full pl-9"
          />
        </div>
        <p className="adm-sub" role="status" aria-live="polite">
          {visibles.length === base.length
            ? `${base.length} ${t(base.length === 1 ? "adm.prod.productOne" : "adm.prod.productMany")}`
            : `${visibles.length} ${t("adm.prod.of")} ${base.length}`}
        </p>
      </div>

      {error && (
        <p role="alert" className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      )}

      {!visibles.length ? (
        <div className="adm-empty">
          <Icon name="search" size={30} />
          <p className="font-semibold text-navy">{t("adm.prod.noMatch")}</p>
          <p className="text-sm">{t("adm.prod.noMatchHint")}</p>
        </div>
      ) : (
        <div className="adm-scroll">
          <table className="adm-table">
            <caption className="sr-only">{t("adm.prod.activeProducts")}</caption>
            <thead>
              <tr>
                {COLUMNAS.map((c) => {
                  const activa = orden.clave === c.clave;
                  return (
                    <th
                      key={c.clave}
                      aria-sort={activa ? (orden.direccion === "asc" ? "ascending" : "descending") : "none"}
                      className={c.numerica ? "text-right" : undefined}
                    >
                      <button
                        type="button"
                        onClick={() => alOrdenar(c.clave)}
                        className={`inline-flex items-center gap-1 hover:text-navy ${c.numerica ? "flex-row-reverse" : ""}`}
                      >
                        {t(c.titulo)}
                        <Flecha activa={activa} arriba={orden.direccion === "asc"} />
                      </button>
                    </th>
                  );
                })}
                <th className="text-right">{t("adm.prod.actions")}</th>
              </tr>
            </thead>
            <tbody>
              {visibles.map((p) => (
                <tr key={p.id}>
                  <td className="font-mono text-xs">{p.sku}</td>
                  <td className="font-medium">{p.name}</td>
                  <td className="text-slate-500">{p.category}</td>
                  <td className="text-right">{p.priceUsd.toFixed(2)}</td>
                  <td className="text-right">
                    {p.stock <= p.lowStockAt ? <span className="badge badge-danger">{p.stock} · {t("adm.prod.low")}</span> : <span>{p.stock}</span>}
                  </td>
                  <td className="text-right">
                    <div className="flex justify-end gap-1">
                      <Link className="btn btn-quiet btn-xs" href={`/admin/productos/${p.id}`}>
                        {t("adm.prod.edit")}
                      </Link>
                      {puedeEliminar ? (
                        <button
                          type="button"
                          className="btn btn-danger btn-xs"
                          onClick={() => {
                            setError(null);
                            setMotivo("Sin existencias");
                            setDetalle("");
                            setABorrar(p);
                          }}
                          aria-label={`${t("adm.prod.delete")} ${p.name}`}
                        >
                          <Icon name="trash" size={12} /> {t("adm.prod.delete")}
                        </button>
                      ) : (
                        <span className="px-1 text-[11px] text-slate-400">{t("adm.prod.adminOnly")}</span>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <Modal open={!!aBorrar} title={t("adm.prod.deleteTitle")} onClose={() => (borrando ? null : setABorrar(null))}>
        <p className="text-sm text-slate-600">
          {t("adm.prod.deleteConfirmLead")} <strong className="text-navy">{aBorrar?.name}</strong>? {t("adm.prod.deleteConfirmTail")}
        </p>
        <p className="mt-2 text-xs text-slate-500">
          {t("adm.prod.deleteKeepHistory")}
        </p>
        <label className="mt-4 block text-xs font-semibold text-slate-600">
          {t("adm.prod.reason")}
          <select className="input mt-1" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="Sin existencias">{t("adm.prod.reasonOutOfStock")}</option>
            <option value="Producto dañado">{t("adm.prod.reasonDamaged")}</option>
            <option value="Descontinuado">{t("adm.prod.reasonDiscontinued")}</option>
            <option value="Duplicado">{t("adm.prod.reasonDuplicate")}</option>
            <option value="Otro">{t("adm.prod.reasonOther")}</option>
          </select>
        </label>
        <label className="mt-2 block text-xs font-semibold text-slate-600">
          {t("adm.prod.detailOptional")}
          <input className="input mt-1" value={detalle} onChange={(e) => setDetalle(e.target.value)} maxLength={300} placeholder={t("adm.prod.detailPlaceholder")} />
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button type="button" className="btn btn-ghost btn-sm" onClick={() => setABorrar(null)} disabled={borrando}>
            {t("adm.prod.cancel")}
          </button>
          <button type="button" className="btn btn-primary btn-sm" onClick={eliminar} disabled={borrando}>
            {borrando ? t("adm.prod.deleting") : t("adm.prod.deleteYes")}
          </button>
        </div>
      </Modal>
    </>
  );
}
