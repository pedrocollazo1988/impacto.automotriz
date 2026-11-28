"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { usePreferences } from "@/components/site/Preferences";
import { Modal, inputCls } from "@/components/admin/ui";

export default function OrderActions({ id, paid, status, items, puedeQuitar }: { id: string; paid: boolean; status: string; items: { id: number; name: string; qty: number }[]; puedeQuitar: boolean }) {
  const router = useRouter();
  const { t } = usePreferences();
  const [pin, setPin] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [quitar, setQuitar] = useState(false);
  const [itemId, setItemId] = useState(String(items[0]?.id ?? ""));
  const [motivo, setMotivo] = useState("Producto no disponible");
  const [err, setErr] = useState("");
  const call = async (body: object) => {
    const r = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    if (!r.ok) setErr((await r.json()).error ?? t("adm.pedidos.actionError")); else setErr("");
    router.refresh(); return r.ok;
  };
  if (status === "CANCELED" || status === "DELIVERED") return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {!paid && <button className="btn btn-primary btn-xs" onClick={() => call({ action: "confirm-payment" })}>{t("adm.pedidos.markPaid")}</button>}
      <button className="btn btn-ghost btn-xs" onClick={() => call({ action: "status", value: "PREPARING" })}>{t("ord.st.PREPARING")}</button>
      <button className="btn btn-ghost btn-xs" onClick={() => call({ action: "status", value: "SHIPPED" })}>{t("ord.st.SHIPPED")}</button>
      <button className="btn btn-ghost btn-xs" onClick={() => { setPin(""); setErr(""); }}>{t("adm.pedidos.deliverWithPin")}</button>
      {puedeQuitar && items.length > 1 && (
        <button className="btn btn-ghost btn-xs" onClick={() => { setItemId(String(items[0]?.id ?? "")); setMotivo("Producto no disponible"); setQuitar(true); }}>
          {t("adm.pedidos.removeProduct")}
        </button>
      )}
      <button className="btn btn-danger btn-xs" onClick={() => setConfirmCancel(true)}>{t("dir.cancel")}</button>
      {err && <span className="text-xs text-red-600">{err}</span>}

      <Modal open={pin !== null} title={t("adm.pedidos.confirmDeliveryTitle")} onClose={() => setPin(null)}>
        <p className="mb-2 text-sm text-slate-600">{t("adm.pedidos.pinHint")}</p>
        <input className={inputCls} autoFocus value={pin ?? ""} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder={t("adm.pedidos.pinPlaceholder")} inputMode="numeric" maxLength={6}
          onKeyDown={(e) => e.key === "Enter" && pin?.length === 6 && call({ action: "deliver", pin }).then((ok) => ok && setPin(null))} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setPin(null)}>{t("dir.cancel")}</button>
          <button className="btn btn-primary btn-sm" disabled={(pin?.length ?? 0) !== 6} onClick={() => call({ action: "deliver", pin }).then((ok) => ok && setPin(null))}>{t("adm.pedidos.deliver")}</button>
        </div>
      </Modal>

      <Modal open={quitar} title={t("adm.pedidos.removeTitle")} onClose={() => setQuitar(false)}>
        <p className="mb-2 text-sm text-slate-600">{t("adm.pedidos.removeHint")}</p>
        <label className="block text-xs font-semibold text-slate-600">{t("order.product")}
          <select className="input mt-1" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.qty}× {i.name}</option>)}
          </select>
        </label>
        <label className="mt-2 block text-xs font-semibold text-slate-600">{t("adm.pedidos.reason")}
          <select className="input mt-1" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option value="Producto no disponible">{t("adm.pedidos.reasonUnavailable")}</option>
            <option value="Producto dañado">{t("adm.pedidos.reasonDamaged")}</option>
            <option value="Error en el pedido">{t("adm.pedidos.reasonError")}</option>
            <option value="Precio incorrecto">{t("adm.pedidos.reasonPrice")}</option>
            <option value="Otro">{t("adm.pedidos.reasonOther")}</option>
          </select>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setQuitar(false)}>{t("dir.cancel")}</button>
          <button className="btn btn-primary btn-sm" disabled={!itemId || motivo.length < 3} onClick={() => call({ action: "remove-item", itemId: Number(itemId), reason: motivo }).then((ok) => ok && setQuitar(false))}>{t("adm.pedidos.remove")}</button>
        </div>
      </Modal>

      <Modal open={confirmCancel} title={t("adm.pedidos.cancelTitle")} onClose={() => setConfirmCancel(false)}>
        <p className="mb-4 text-sm text-slate-600">{t("adm.pedidos.cancelHint")}</p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)}>{t("adm.pedidos.back")}</button>
          <button className="btn btn-danger btn-sm" onClick={() => call({ action: "status", value: "CANCELED" }).then((ok) => ok && setConfirmCancel(false))}>{t("adm.pedidos.cancelYes")}</button>
        </div>
      </Modal>
    </div>
  );
}
