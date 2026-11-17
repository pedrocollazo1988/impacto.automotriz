"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useCart } from "@/components/CartProvider";
import DeliverySelector, { type DeliveryChoice } from "@/components/DeliverySelector";

export default function Checkout() {
  const { items, clear } = useCart(); const router = useRouter();
  const [subtotal, setSubtotal] = useState(0); const [fee, setFee] = useState(0); const [delivery, setDelivery] = useState<DeliveryChoice | null>(null);
  const [c, setC] = useState({ name: "", email: "", phone: "" }); const [pay, setPay] = useState<"TROPIPAY" | "QVAPAY" | "TRANSFER" | "CASH">("TRANSFER"); const [gw, setGw] = useState({ tropipay: false, qvapay: false });
  const [code, setCode] = useState(""); const [coupon, setCoupon] = useState<{ code: string; discountUsd: number } | null>(null); const [couponMsg, setCouponMsg] = useState("");
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);

  useEffect(() => { fetch("/api/payments/methods").then((r) => r.json()).then((m) => { setGw(m); if (m.tropipay) setPay("TROPIPAY"); else if (m.qvapay) setPay("QVAPAY"); }); }, []);
  useEffect(() => { fetch("/api/account/session").then((r) => r.json()).then((m) => m && setC({ name: m.name ?? "", email: m.email ?? "", phone: m.phone ?? "" })); }, []);
  useEffect(() => {
    if (!items.length) return;
    fetch("/api/cart/price", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }).then((r) => r.json()).then((d) => setSubtotal(d.subtotalUsd ?? 0));
  }, [items]);
  const applyCoupon = async () => {
    const r = await fetch("/api/coupon/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotalUsd: subtotal }) }); const j = await r.json();
    if (r.ok && j.code) { setCoupon(j); setCouponMsg(`Cupón ${j.code} aplicado`); } else { setCoupon(null); setCouponMsg(j.error ?? "Cupón no válido"); }
  };
  const discount = coupon?.discountUsd ?? 0; const base = Math.max(0, subtotal - discount);

  const submit = async () => {
    setBusy(true); setErr("");
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, customer: c, delivery, paymentMethod: pay, coupon: coupon?.code }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) return setErr(j.error ?? "No se pudo crear el pedido");
    clear(); if (j.paymentUrl) window.location.href = j.paymentUrl; else router.push(`/pedido/${j.orderId}`);
  };
  const input = "w-full rounded-lg border px-3 py-2 text-sm";
  if (!items.length) return <p>Tu carrito está vacío.</p>;
  const ready = delivery && c.name.length > 1 && /\S+@\S+\.\S+/.test(c.email) && c.phone.length > 5;
  return (
    <div className="mx-auto max-w-2xl space-y-6"><h1 className="text-2xl font-bold text-navy">Finalizar compra</h1>
      <section className="space-y-3"><h2 className="font-semibold">Tus datos</h2>
        <input className={input} placeholder="Nombre completo" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
        <div className="grid gap-3 sm:grid-cols-2"><input className={input} placeholder="Correo" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} /><input className={input} placeholder="Teléfono" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} /></div></section>
      <section className="space-y-3"><h2 className="font-semibold">Entrega</h2><DeliverySelector subtotalUsd={base} onChange={(d, f) => { setDelivery(d); setFee(f); }} /></section>
      <section className="space-y-2"><h2 className="font-semibold">Cupón</h2>
        <div className="flex gap-2"><input className={input} placeholder="Código de descuento" value={code} onChange={(e) => setCode(e.target.value)} /><button className="rounded border px-4 text-sm" onClick={applyCoupon}>Aplicar</button></div><p className="text-sm text-slate-600">{couponMsg}</p></section>
      <section className="space-y-2"><h2 className="font-semibold">Pago</h2>
        {([["TROPIPAY", "Tarjeta / Tropipay (en línea)"], ["QVAPAY", "QvaPay (en línea)"], ["TRANSFER", "Transferencia bancaria"], ["CASH", "Efectivo contra entrega o en el local"]] as const).filter(([v]) => (v === "TROPIPAY" ? gw.tropipay : v === "QVAPAY" ? gw.qvapay : true)).map(([v, l]) => <label key={v} className="flex gap-2 text-sm"><input type="radio" checked={pay === v} onChange={() => setPay(v)} />{l}</label>)}</section>
      <div className="rounded-lg bg-slate-50 p-4 text-sm"><p>Subtotal: {subtotal.toFixed(2)} USD</p>{discount > 0 && <p className="text-green-700">Descuento: −{discount.toFixed(2)} USD</p>}<p>Envío: {fee.toFixed(2)} USD</p><p className="text-lg font-bold">Total: {(base + fee).toFixed(2)} USD</p><p className="text-xs text-slate-500">El importe final lo confirma el servidor.</p></div>
      {err && <p className="text-sm text-red-600">{err}</p>}
      <button disabled={!ready || busy} onClick={submit} className="w-full rounded-lg bg-navy py-3 font-semibold text-white disabled:opacity-40">{busy ? "Procesando…" : "Confirmar pedido"}</button>
    </div>);
}
