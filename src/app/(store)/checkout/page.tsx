"use client";
import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useCart } from "@/components/CartProvider";
import DeliverySelector, { type DeliveryChoice } from "@/components/DeliverySelector";
import Icon from "@/components/brand/Icon";
import { textoEnvio, validarCheckout } from "@/lib/checkout-validation";
import { usePreferences } from "@/components/site/Preferences";
import Avatar from "@/components/cuenta/Avatar";
import { track } from "@/lib/analytics";
import Turnstile from "@/components/Turnstile";
import AuthForm from "@/components/AuthForm";

// Los métodos los define el panel (nombre, icono, descripción, datos y
// comisión). Aquí no hay una lista fija de pasarelas.
type Metodo = {
  key: string;
  provider: string;
  name: string;
  description: string;
  kind: "online" | "manual";
  icon: string;
  instructions: string;
  feePercent: number;
  automatic: boolean;
  details: { etiqueta: string; valor: string }[];
  url: string | null;
};

const ERROR_EN: Record<string, string> = {
  "Ajusta el carrito: hay productos por encima del stock disponible.": "Adjust the cart: some products exceed available stock.",
  "Escribe tu nombre completo.": "Enter your full name.",
  "Escribe un correo válido, por ejemplo nombre@correo.com.": "Enter a valid email, for example name@email.com.",
  "Escribe un teléfono con al menos 6 dígitos.": "Enter a phone with at least 6 digits.",
  "Completa la entrega: provincia, municipio, método y datos de quien recibe.": "Complete delivery: province, municipality, method and recipient details.",
  "Elige un método de pago.": "Choose a payment method.",
};

export default function Checkout() {
  const { items, clear, ready: cartReady } = useCart();
  const { t, lang } = usePreferences();
  const tt = (key: string, vars: Record<string, string | number>) => Object.entries(vars).reduce((txt, [k, v]) => txt.replace(`{${k}}`, String(v)), t(key));
  const msg = (texto: string) => (lang === "en" ? ERROR_EN[texto] ?? texto : texto);
  const router = useRouter();
  const [subtotal, setSubtotal] = useState(0); const [fee, setFee] = useState(0); const [delivery, setDelivery] = useState<DeliveryChoice | null>(null);
  const [deliveryName, setDeliveryName] = useState("");
  const [intento, setIntento] = useState(false);
  const [c, setC] = useState({ name: "", email: "", phone: "" });
  const [pay, setPay] = useState("");
  const [metodos, setMetodos] = useState<Metodo[]>([]);
  const [code, setCode] = useState(""); const [coupon, setCoupon] = useState<{ code: string; discountUsd: number } | null>(null); const [couponMsg, setCouponMsg] = useState("");
  const [cartOk, setCartOk] = useState(true);
  const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState(""); const [captchaKey, setCaptchaKey] = useState(0);
  const [session, setSession] = useState<"loading" | "in" | "out">("loading");
  const [avatar, setAvatar] = useState<string | null>(null);
  // El correo se fija solo si la cuenta ya tiene uno: quien entra por SMS lo escribe aquí.
  const [emailFijo, setEmailFijo] = useState(false);

  useEffect(() => {
    const total = Math.max(0, subtotal - (coupon?.discountUsd ?? 0)) + fee;
    fetch(`/api/payments/methods?total=${total.toFixed(2)}`).then((r) => r.json())
      .then((m: { methods?: Metodo[] }) => {
        const lista = m.methods ?? [];
        setMetodos(lista);
        // Si el método elegido deja de estar disponible, se pasa al primero.
        setPay((actual) => (lista.some((x) => x.key === actual) ? actual : (lista[0]?.key ?? "")));
      });
  }, [subtotal, coupon, fee]);
  useEffect(() => {
    fetch("/api/account/session")
      .then((r) => r.json())
      .then((m) => {
        if (!m) { setSession("out"); return; }
        setC({ name: m.name ?? "", email: m.email ?? "", phone: m.phoneE164 ?? m.phone ?? "" });
        setEmailFijo(!!m.email);
        setAvatar(typeof m.avatarUrl === "string" ? m.avatarUrl : null);
        setSession("in");
      })
      .catch(() => setSession("out"));
  }, []);
  useEffect(() => {
    if (!items.length) return;
    fetch("/api/cart/price", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }) }).then((r) => r.json()).then((d) => { setSubtotal(d.subtotalUsd ?? 0); setCartOk(d.allOk ?? false); });
  }, [items]);
  const applyCoupon = async () => {
    const r = await fetch("/api/coupon/check", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ code, subtotalUsd: subtotal }) }); const j = await r.json();
    if (r.ok && j.code) { setCoupon(j); setCouponMsg(tt("checkout.couponOk", { code: j.code })); } else { setCoupon(null); setCouponMsg(j.error ?? t("checkout.couponBad")); }
  };
  const discount = coupon?.discountUsd ?? 0; const base = Math.max(0, subtotal - discount);
  const metodo = metodos.find((m) => m.key === pay);
  const errores = validarCheckout({ name: c.name, email: c.email, phone: c.phone, cartOk, hasDelivery: !!delivery, hasPayment: !!metodo });
  const faltantes = Object.values(errores).filter(Boolean) as string[];
  const comisionMonto = metodo?.feePercent ? Math.round((base + fee) * (metodo.feePercent / 100) * 100) / 100 : 0;

  const submit = async () => {
    setIntento(true);
    if (faltantes.length) { setErr(t("checkout.review")); return; }
    if (!cartOk) return setErr(t("checkout.adjustStock"));
    if (!metodo) return setErr(t("checkout.choosePayment"));
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha) return setErr(t("checkout.captcha"));
    setBusy(true); setErr("");
    const r = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items, customer: c, delivery, paymentMethod: pay, coupon: coupon?.code, turnstileToken: captcha }) });
    const j = await r.json(); setBusy(false);
    if (!r.ok) {
      setCaptcha(""); setCaptchaKey((k) => k + 1);
      if (r.status === 401) { setSession("out"); return setErr("Inicia sesión para completar la compra."); }
      return setErr(j.error ?? t("checkout.createError"));
    }
    clear(); if (j.paymentUrl) window.location.href = j.paymentUrl; else router.push(`/pedido/${j.orderId}`);
  };
  if (!cartReady) return (
    <div className="container-x py-8" aria-busy="true">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_380px]">
        <div className="space-y-4">{[0, 1, 2].map((i) => <div key={i} className="card h-40 animate-pulse bg-slate-50" />)}</div>
        <div className="card h-64 animate-pulse bg-slate-50" />
      </div>
    </div>
  );

  if (!items.length) return (
    <div className="container-x py-16"><div className="card mx-auto grid max-w-md place-items-center p-10 text-center">
      <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="cart" size={30} /></span>
      <h1 className="mt-4 font-display text-xl font-bold text-navy">{t("checkout.empty")}</h1>
      <Link href="/catalogo" className="btn btn-primary mt-5">{t("checkout.viewCatalog")}</Link>
    </div></div>
  );

  if (session === "loading") return (
    <div className="container-x py-8" aria-busy="true">
      <div className="h-9 w-56 animate-pulse rounded-lg bg-slate-100" />
      <div className="card mx-auto mt-6 h-56 max-w-md animate-pulse bg-slate-50" />
    </div>
  );

  if (session === "out") return (
    <div className="container-x py-10">
      <div className="mx-auto grid max-w-5xl items-start gap-8 lg:grid-cols-[1fr_420px]">
        <div>
          <span className="eyebrow">Compra segura</span>
          <h1 className="mt-2 font-display text-3xl font-extrabold text-navy">Inicia sesión para comprar</h1>
          <p className="mt-3 max-w-md text-slate-500">Solo las cuentas registradas pueden finalizar una compra. Así podemos asociar el pedido a tu historial, enviarte el seguimiento y proteger tus datos.</p>
          <ul className="mt-6 space-y-3 text-sm text-slate-600">
            {["Tu carrito se conserva mientras inicias sesión", "Puedes seguir el pedido desde Mi cuenta", "Recibirás el código de entrega en tu correo"].map((x) => (
              <li key={x} className="flex items-center gap-2"><Icon name="check" size={16} className="text-[color:var(--color-ok)]" /> {x}</li>
            ))}
          </ul>
          <Link href="/carrito" className="btn btn-ghost mt-6"><Icon name="cart" size={16} /> Volver al carrito</Link>
        </div>
        <AuthForm next="/checkout" />
      </div>
    </div>
  );
  const ready = faltantes.length === 0;

  return (
    <div className="container-x py-8">
      <h1 className="font-display text-3xl font-extrabold text-navy">{t("checkout.title")}</h1>
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-5">
          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-navy)] text-xs text-white">1</span> {t("checkout.stepData")}</h2>
            {session === "in" && (
              <p className="mt-3 flex items-center gap-2 text-xs text-slate-500">
                <Avatar url={avatar} name={c.name} size={24} redondo />
                {tt("checkout.loggedAs", { name: c.name })}
              </p>
            )}
            <div className="mt-4 grid gap-3 sm:grid-cols-2">
              <label className="block sm:col-span-2">
                <span className="mb-1 block text-xs font-semibold text-slate-600">{t("checkout.name")}</span>
                <input className={`input ${intento && errores.name ? "border-red-400 ring-2 ring-red-100" : ""}`} autoComplete="name" placeholder="Nombre y apellidos" value={c.name} onChange={(e) => setC({ ...c, name: e.target.value })} aria-invalid={intento && !!errores.name} />
                {intento && errores.name && <span className="mt-1 block text-xs text-red-600">{errores.name}</span>}
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">{t("checkout.email")}</span>
                <input className={`input ${emailFijo ? "bg-slate-50 text-slate-500" : ""} ${intento && errores.email ? "border-red-400 ring-2 ring-red-100" : ""}`} type="email" autoComplete="email" placeholder="tu@correo.com" value={c.email} readOnly={emailFijo} onChange={(e) => setC({ ...c, email: e.target.value })} aria-invalid={intento && !!errores.email} />
                {intento && errores.email && <span className="mt-1 block text-xs text-red-600">{errores.email}</span>}
              </label>
              <label className="block">
                <span className="mb-1 block text-xs font-semibold text-slate-600">{t("checkout.phone")}</span>
                <input className={`input ${intento && errores.phone ? "border-red-400 ring-2 ring-red-100" : ""}`} type="tel" autoComplete="tel" placeholder="+53 5 000 0000" value={c.phone} onChange={(e) => setC({ ...c, phone: e.target.value })} aria-invalid={intento && !!errores.phone} />
                {intento && errores.phone && <span className="mt-1 block text-xs text-red-600">{errores.phone}</span>}
              </label>
            </div>
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-navy)] text-xs text-white">2</span> {t("checkout.stepDelivery")}</h2>
            <p className="mt-1 text-xs text-slate-500">{t("checkout.deliveryHint")}</p>
            <div className="mt-4"><DeliverySelector subtotalUsd={base} onChange={(d, f, n) => { setDelivery(d); setFee(f); setDeliveryName(n ?? ""); }} /></div>
            {intento && errores.delivery && <p role="alert" className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><Icon name="info" size={14} className="mt-0.5 shrink-0" />{errores.delivery}</p>}
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-lg font-bold text-navy"><span className="grid h-6 w-6 place-items-center rounded-full bg-[color:var(--color-navy)] text-xs text-white">3</span> {t("checkout.stepPayment")}</h2>
            <div className="mt-4 space-y-2">
              {!metodos.length && <p className="rounded-lg bg-amber-50 px-3 py-2 text-sm text-amber-900">{t("checkout.noPayments")}</p>}
              {metodos.map((m) => (
                <label key={m.key} className={`flex cursor-pointer items-start gap-3 rounded-xl border p-3 transition ${pay === m.key ? "border-[color:var(--color-action)] bg-[color:var(--color-action)]/5 ring-2 ring-[color:var(--color-action)]/20" : "border-slate-200 hover:border-slate-300"}`}>
                  <input type="radio" name="payment" checked={pay === m.key} onChange={() => setPay(m.key)} className="mt-1 accent-[color:var(--color-action)]" />
                  <span className="grid h-10 w-10 shrink-0 place-items-center rounded-lg bg-slate-100 text-navy"><Icon name={m.icon} size={20} /></span>
                  <span className="min-w-0 flex-1">
                    <span className="flex flex-wrap items-center gap-2">
                      <span className="text-sm font-semibold text-slate-800">{m.name}</span>
                      <span className={`badge ${m.automatic ? "badge-info" : "badge-mute"}`}>{m.automatic ? t("checkout.auto") : t("checkout.manual")}</span>
                    </span>
                    <span className="mt-0.5 block text-xs text-slate-500">{m.description}</span>
                    {m.feePercent > 0 && <span className="mt-0.5 block text-xs font-semibold text-[color:var(--color-action-deep)]">{tt("checkout.commission", { n: m.feePercent })}</span>}
                    {pay === m.key && (m.instructions || m.details.length > 0 || m.url) && (
                      <span className="mt-2 block rounded-lg bg-slate-50 px-2.5 py-2 text-xs leading-relaxed text-slate-600">
                        {m.instructions && <span className="block whitespace-pre-line">{m.instructions}</span>}
                        {m.details.length > 0 && (
                          <span className="mt-1 block space-y-0.5">
                            {m.details.map((d) => <span key={d.etiqueta} className="block"><b className="font-semibold text-slate-700">{d.etiqueta}:</b> {d.valor}</span>)}
                          </span>
                        )}
                        {m.url && <span className="mt-1 block break-all text-[color:var(--color-action-deep)]">{m.url}</span>}
                      </span>
                    )}
                  </span>
                </label>
              ))}
            </div>
            {intento && errores.payment && <p role="alert" className="mt-2 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-xs text-red-700"><Icon name="info" size={14} className="mt-0.5 shrink-0" />{errores.payment}</p>}
          </section>

          <section className="card p-5">
            <h2 className="flex items-center gap-2 font-display text-sm font-bold text-navy"><Icon name="tag" size={16} /> {t("checkout.coupon")}</h2>
            <div className="mt-3 flex gap-2">
              <input className="input" placeholder={t("checkout.code")} value={code} onChange={(e) => setCode(e.target.value)} />
              <button className="btn btn-ghost" onClick={applyCoupon}>{t("checkout.apply")}</button>
            </div>
            {couponMsg && <p className={`mt-2 text-sm ${coupon ? "text-emerald-700" : "text-red-600"}`}>{couponMsg}</p>}
          </section>
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-navy">{t("checkout.summary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">{t("checkout.subtotal")}</dt><dd className="font-semibold">{subtotal.toFixed(2)} USD</dd></div>
              {discount > 0 && <div className="flex justify-between text-emerald-700"><dt>{t("checkout.discount")}</dt><dd className="font-semibold">−{discount.toFixed(2)} USD</dd></div>}
              <div className="flex justify-between gap-3"><dt className="text-slate-500">{t("checkout.deliveryFee")}{deliveryName && <span className="block text-[11px] font-normal text-slate-400">{deliveryName}</span>}</dt><dd className={`font-semibold ${delivery ? "" : "text-slate-400"}`}>{textoEnvio(!!delivery, fee, lang)}</dd></div>
              {comisionMonto > 0 && <div className="flex justify-between"><dt className="text-slate-500">{t("checkout.paymentFee")}</dt><dd className="font-semibold">{comisionMonto.toFixed(2)} USD</dd></div>}
              <div className="flex justify-between border-t border-slate-100 pt-3 text-lg"><dt className="font-semibold">{t("checkout.total")}</dt><dd className="font-display font-extrabold text-navy">{(base + fee + comisionMonto).toFixed(2)} USD</dd></div>
            </dl>
            {metodo && <p className="mt-3 rounded-lg bg-slate-50 px-3 py-2 text-xs text-slate-500">{t("checkout.payWith")} <b className="text-slate-700">{metodo.name}</b></p>}
            {!cartOk && <p className="mt-3 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{t("checkout.stockWarn")} <Link href="/carrito" className="font-semibold underline">{t("checkout.adjustCart")}</Link></p>}
            {intento && faltantes.length > 0 && (
              <div role="alert" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">
                <p className="font-semibold">{t("checkout.missing")}</p>
                <ul className="mt-1 list-disc space-y-0.5 pl-5 text-xs">{faltantes.map((x) => <li key={x}>{msg(x)}</li>)}</ul>
              </div>
            )}
            {err && <p aria-live="polite" className="mt-3 rounded-lg bg-red-50 p-3 text-sm text-red-700">{err}</p>}
            <Turnstile key={captchaKey} onToken={setCaptcha} className="mt-4" />
            <button disabled={busy} onClick={submit} className="btn btn-primary mt-3 w-full text-base disabled:opacity-40">
              {busy ? t("checkout.processing") : <><Icon name="check" size={18} /> {t("checkout.confirm")}</>}
            </button>
            {!ready && <p className="mt-3 text-center text-xs text-slate-400">{t("checkout.pressConfirm")}</p>}
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400"><Icon name="shield" size={13} /> {t("checkout.finalNote")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
