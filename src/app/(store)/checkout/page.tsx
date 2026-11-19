"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import DeliverySelector, { type DeliveryChoice } from "@/components/DeliverySelector";
import Icon from "@/components/brand/Icon";

const PAY_LABELS: Record<string, [string, string, string]> = {
  TROPIPAY: ["card", "Tarjeta / Tropipay", "Pago en línea con confirmación automática"],
  QVAPAY: ["bolt", "QvaPay", "Pago en línea con confirmación automática"],
  TRANSFER: ["bank", "Transferencia bancaria", "Confirmamos el pago manualmente"],
  CASH: ["box", "Efectivo contra entrega", "Pagas al recibir o en el local"],
};

export default function Checkout() {
  const { items, clear } = useCart();
  const router = useRouter();
  const [subtotal, setSubtotal] = useState(0); const [fee, setFee] = useState(0); const [delivery, setDelivery] = useState<DeliveryChoice | null>(null);
  const [c, setC] = useState({ name: "", email: "", phone: "" });
  const [pay, setPay] = useState<"TROPIPAY" | "QVAPAY" | "TRANSFER" | "CASH">("TRANSFER");
  const [gw, setGw] = useState({ tropipay: false, qvapay: false });
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
  if (!items.length) return (
    <div className="container-x py-16"><div className="card mx-auto grid max-w-md place-items-center p-10 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="cart" size={30} /></span>
      <h1 className="mt-4 font-display text-xl font-bold text-navy">Tu carrito está vacío</h1>
      <Link href="/catalogo" className="btn btn-primary mt-5">Ver catálogo</Link>
    </div></div>
  );
  const ready = delivery && c.name.length > 1 && /\S+@\S+\.\S+/.test(c.email) && c.phone.length > 5;

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl font-extrabold text-navy">Finalizar compra</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-navy)] text-xs text-white">1</span> Tus datos</h2>
            <div className="mt-4 space-y-3">
              <input className="input" placeholder="Nombre completo" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} />
              <div className="grid gap-3 sm:grid-cols-2">
                <input className="input" placeholder="Correo electrónico" value={c.email} onChange={(e) => setC({ ...c, email: e.target.value })} />
                <input className="input" placeholder="Teléfono" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} />
              </div>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-navy)] text-xs text-white">2</span> Entrega</h2>
            <div className="mt-4"><DeliverySelector subtotalUsd={base} onChange={(d, f) => { setDelivery(d); setFee(f); }} /></div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-navy)] text-xs text-white">3</span> Pago</h2>
            <div className="mt-4 space-y-2">
              {(["TROPIPAY", "QVAPAY", "TRANSFER", "CASH"] as const).filter((v) => (v === "TROPIPAY" ? gw.tropipay : v === "QVAPAY" ? gw.qvapay : true)).map((v) => {
                const [ic, label, hint] = PAY_LABELS[v];
                return (
                  <label key={v} className={`flex cursor-pointer items-center gap-3 rounded-xl border p-3 transition ${pay === v ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)]/5 ring-2 ring-[color:var(--color-accent)]/20" : "border-slate-200 hover:border-slate-300"}`}>
                    <input type="radio" checked={pay === v} onChange={() => setPay(v)} className="accent-[color:var(--color-accent)]" />
                    <span className="grid h-9 w-9 place-items-center rounded-lg bg-slate-100 text-navy"><Icon name={ic === "bank" ? "card" : ic} size={18} /></span>
                    <span><span className="block text-sm font-semibold text-slate-800">{label}</span><span className="block text-xs text-slate-500">{hint}</span></span>
                  </label>
                );
              })}
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy"><Icon name="tag" size={16} /> Cupón de descuento</h2>
            <div className="mt-3 flex gap-2">
              <input className="input" placeholder="Código de descuento" value={code} onChange={(e) => setCode(e.target.value)} />
              <button className="btn btn-ghost" onClick={applyCoupon}>Aplicar</button>
            </div>
            {couponMsg && <p className={`mt-2 text-sm ${coupon ? "text-[color:var(--color-ok)]" : "text-red-600"}`}>{couponMsg}</p>}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-navy">Tu pedido</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">Subtotal</dt><dd className="font-semibold">{subtotal.toFixed(2)} USD</dd></div>
              {discount > 0 && <div className="flex justify-between text-[color:var(--color-ok)]"><dt>Descuento</dt><dd className="font-semibold">−{discount.toFixed(2)} USD</dd></div>}
              <div className="flex justify-between"><dt className="text-slate-500">Envío</dt><dd className="font-semibold">{fee.toFixed(2)} USD</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-lg"><dt className="font-semibold">Total</dt><dd className="font-display font-extrabold text-navy">{(base + fee).toFixed(2)} USD</dd></div>
            </dl>
            {err && <p className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
            <button disabled={!ready || busy} onClick={submit} className="btn btn-primary mt-5 w-full text-base disabled:opacity-40">
              {busy ? "Procesando…" : <><Icon name="check" size={18} /> Confirmar pedido</>}
            </button>
            {!ready && <p className="mt-3 text-center text-xs text-slate-400">Completa tus datos y la entrega para continuar.</p>}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400"><Icon name="shield" size={13} /> El importe final lo confirma el servidor.</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
