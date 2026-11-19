"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { Modal, inputCls } from "@/components/admin/ui";

export default function OrderActions({ id, paid, status }: { id: string; paid: boolean; status: string }) {
  const router = useRouter();
  const [pin, setPin] = useState<string | null>(null);
  const [confirmCancel, setConfirmCancel] = useState(false);
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
      <button className="btn btn-danger btn-xs" onClick={() => setConfirmCancel(true)}>Cancelar</button>
      {err && <span className="text-xs text-red-600">{err}</span>}

      <Modal open={pin !== null} title="Confirmar entrega" onClose={() => setPin(null)}>
        <p className="mb-2 text-sm text-slate-600">Introduce el PIN que muestra el cliente para confirmar la entrega.</p>
        <input className={inputCls} autoFocus value={pin ?? ""} onChange={(e) => setPin(e.target.value)} placeholder="PIN de 4 a 6 dígitos"
          onKeyDown={(e) => e.key === "Enter" && pin && call({ action: "deliver", pin }).then((ok) => ok && setPin(null))} />
        <div className="mt-4 flex justify-end gap-2">
          <button className="btn btn-ghost btn-sm" onClick={() => setPin(null)}>Cancelar</button>
          <button className="btn btn-primary btn-sm" disabled={!pin} onClick={() => call({ action: "deliver", pin }).then((ok) => ok && setPin(null))}>Entregar</button>
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
