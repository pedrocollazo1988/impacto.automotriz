"use client";
import { useRouter } from "next/navigation";

export default function OrderActions({ id, paid, status }: { id: string; paid: boolean; status: string }) {
  const router = useRouter();
  const call = async (body: object) => { const r = await fetch("/api/admin/orders", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, ...body }) }); if (!r.ok) alert((await r.json()).error); router.refresh(); };
  if (status === "CANCELED" || status === "DELIVERED") return null;
  const b = "rounded border px-3 py-1 text-xs";
  return (
    <div className="mt-2 flex flex-wrap gap-2">
      {!paid && <button className={b} onClick={() => call({ action: "confirm-payment" })}>Confirmar pago</button>}
      <button className={b} onClick={() => call({ action: "status", value: "PREPARING" })}>En preparación</button>
      <button className={b} onClick={() => call({ action: "status", value: "SHIPPED" })}>Enviado</button>
      <button className={b} onClick={() => { const pin = prompt("PIN que da el cliente:"); if (pin) call({ action: "deliver", pin }); }}>Entregar (PIN)</button>
      <button className={`${b} text-red-600`} onClick={() => confirm("¿Cancelar y devolver existencias?") && call({ action: "status", value: "CANCELED" })}>Cancelar</button>
    </div>);
}
