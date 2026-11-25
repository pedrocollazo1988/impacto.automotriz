"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, inputCls } from "@/components/admin/ui";

export default function OrderActions({ id, paid, status, items, puedeQuitar }: { id: string; paid: boolean; status: string; items: { id: number; name: string; qty: number }[]; puedeQuitar: boolean }) {
  const router = useRouter();
  const [pin, setPin] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
  const [quitar, setQuitar] = useState(false);
  const [itemId, setItemId] = useState(String(items[0]?.id ?? ""));
  const [motivo, setMotivo] = useState("Producto no disponible");
  const [err, setErr] = useState("");
  const call = async (body: object) => {
    const r = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) });
    if (!r.ok) setErr((await r.json()).error ?? "No se pudo completar"); else setErr("");
    router.refresh(); return r.ok;
  };
  if (status === "CANCELED" || status === "DELIVERED") return null;
  return (
    <div className="mt-3 flex flex-wrap items-center gap-2">
      {!paid && <button className="btn btn-primary btn-xs" onClick={() => call({ action: "confirm-payment" })}>Confirmar pago</button>}
      <button className="btn btn-ghost btn-xs" onClick={() => call({ action: "status", value: "PREPARING" })}>En preparación</button>
      <button className="btn btn-ghost btn-xs" onClick={() => call({ action: "status", value: "SHIPPED" })}>Enviado</button>
      <button className="btn btn-ghost btn-xs" onClick={() => { setPin(""); setErr(""); }}>Entregar (PIN)</button>
      {puedeQuitar && items.length > 1 && (
        <button className="btn btn-ghost btn-xs" onClick={() => { setItemId(String(items[0]?.id ?? "")); setMotivo("Producto no disponible"); setQuitar(true); }}>
          Quitar producto
        </button>
      )}
      <button className="btn btn-danger btn-xs" onClick={() => setConfirmCancel(true)}>Cancelar</button>
      {err && <span className="text-xs text-red-600">{err}</span>}

      <Modal open={pin !== null} title="Confirmar entrega" onClose={() => setPin(null)}>
        <p className="mb-2 text-sm text-slate-600">Introduce el PIN que muestra el cliente para confirmar la entrega.</p>
        <input className={inputCls} autoFocus value={pin ?? ""} onChange={(e) => setPin(e.target.value.replace(/\D/g, "").slice(0, 6))} placeholder="PIN de 6 dígitos" inputMode="numeric" maxLength={6}
          onKeyDown={(e) => e.key === "Enter" && pin?.length === 6 && call({ action: "deliver", pin }).then((ok) => ok && setPin(null))} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setPin(null)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={(pin?.length ?? 0) !== 6} onClick={() => call({ action: "deliver", pin }).then((ok) => ok && setPin(null))}>Entregar</button>
        </div>
      </Modal>

      <Modal open={quitar} title="Retirar producto del pedido" onClose={() => setQuitar(false)}>
        <p className="mb-2 text-sm text-slate-600">Se devolverá la cantidad al inventario y se recalculará el total del pedido.</p>
        <label className="block text-xs font-semibold text-slate-600">Producto
          <select className="input mt-1" value={itemId} onChange={(e) => setItemId(e.target.value)}>
            {items.map((i) => <option key={i.id} value={i.id}>{i.qty}× {i.name}</option>)}
          </select>
        </label>
        <label className="mt-2 block text-xs font-semibold text-slate-600">Motivo
          <select className="input mt-1" value={motivo} onChange={(e) => setMotivo(e.target.value)}>
            <option>Producto no disponible</option>
            <option>Producto dañado</option>
            <option>Error en el pedido</option>
            <option>Precio incorrecto</option>
            <option>Otro</option>
          </select>
        </label>
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setQuitar(false)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!itemId || motivo.length < 3} onClick={() => call({ action: "remove-item", itemId: Number(itemId), reason: motivo }).then((ok) => ok && setQuitar(false))}>Retirar</button>
        </div>
      </Modal>

      <Modal open={confirmCancel} title="Cancelar pedido" onClose={() => setConfirmCancel(false)}>
        <p className="mb-4 text-sm text-slate-600">Se devolverán las existencias al inventario. Esta acción no se puede deshacer.</p>
        <div className="flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setConfirmCancel(false)}>Volver</button>
          <button className="btn btn-danger btn-sm" onClick={() => call({ action: "status", value: "CANCELED" }).then((ok) => ok && setConfirmCancel(false))}>Sí, cancelar</button>
        </div>
      </Modal>
    </div>
  );
}
