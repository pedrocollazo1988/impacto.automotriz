"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart } from "@/components/CartProvider";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

type Line = { productId: number; variantId: number | null; slug: string; name: string; image: string | null; unitUsd: number; qty: number; stock: number; ok: boolean; totalUsd: number };

export default function Carrito() {
  const { items, setQty, remove, ttlHoras, expiresAt, ready, aviso } = useCart();
  const { t, lang } = usePreferences();
  const tt = (key: string, vars: Record<string, string | number>) => Object.entries(vars).reduce((txt, [k, v]) => txt.replace(`{${k}}`, String(v)), t(key));
  const [data, setData] = useState<{ lines: Line[]; subtotalUsd: number; allOk: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [session, setSession] = useState<"loading" | "in" | "out">("loading");
  useEffect(() => {
    fetch("/api/account/session")
      .then((r) => r.json())
      .then((m) => setSession(m ? "in" : "out"))
      .catch(() => setSession("out"));
  }, []);
  useEffect(() => {
    if (!items.length) { setData(null); setLoading(false); return; }
    // Al cambiar cantidades se espera un instante: así cinco clics seguidos
    // no disparan cinco peticiones ni hacen parpadear el resumen.
    const ctrl = new AbortController();
    setLoading(true);
    const t = window.setTimeout(() => {
      fetch("/api/cart/price", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ items }), signal: ctrl.signal })
        .then((r) => r.json())
        .then((d) => { if (d.lines) setData(d); })
        .catch(() => {})
        .finally(() => setLoading(false));
    }, 180);
    return () => { window.clearTimeout(t); ctrl.abort(); };
  }, [items]);
  const qtyDe = (l: Line) => items.find((i) => i.productId === l.productId && (i.variantId ?? null) === (l.variantId ?? null))?.qty ?? l.qty;
  const hasta = expiresAt ? new Date(expiresAt).toLocaleString(lang === "en" ? "en-US" : "es-CU", { dateStyle: "short", timeStyle: "short" }) : null;

  if (!ready) return (
    <div className="container-x py-8" aria-busy="true">
      <div className="h-9 w-40 animate-pulse rounded-lg bg-slate-100" />
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">{[0, 1, 2].map((i) => <div key={i} className="card h-28 animate-pulse bg-slate-50" />)}</div>
        <div className="card h-56 animate-pulse bg-slate-50" />
      </div>
    </div>
  );

  if (!items.length) return (
    <div className="container-x py-16">
      <div className="card mx-auto grid max-w-md place-items-center p-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="cart" size={30} /></span>
        <h1 className="mt-4 font-display text-xl font-bold text-navy">{t("cart.empty")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("cart.emptyHint")}</p>
        <Link href="/catalogo" className="btn btn-primary mt-5"><Icon name="grid" size={18} /> {t("cart.viewCatalog")}</Link>
      </div>
    </div>
  );

  return (
    <div className="container-x py-8">
      <div className="flex flex-wrap items-end justify-between gap-2">
        <h1 className="font-display text-3xl font-extrabold text-navy">{t("cart.title")}</h1>
        <p className="rounded-full bg-slate-100 px-3 py-1 text-xs font-medium text-slate-500">{hasta ? tt("cart.ttlUntil", { h: ttlHoras, date: hasta }) : tt("cart.ttlSaved", { h: ttlHoras })}</p>
      </div>
      <p className="mt-2 text-xs text-slate-500">{lang === "es" && aviso ? aviso : t("cart.ttlNote")}</p>
      {session === "out" && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-sky-200 bg-sky-50 px-4 py-3 text-sm text-sky-900">
          <Icon name="info" size={16} className="shrink-0" />
          <span className="min-w-0 flex-1">Estás comprando como invitado. Para confirmar el pedido necesitas una cuenta; tu carrito se conserva.</span>
          <Link href="/checkout" className="btn btn-primary btn-sm">Iniciar sesión</Link>
        </div>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {loading && <p className="text-sm text-slate-400" aria-live="polite">{t("cart.updating")}</p>}
          {data?.lines.map((l) => {
            const qty = qtyDe(l);
            const ok = qty <= l.stock;
            return (
            <div key={`${l.productId}-${l.variantId}`} className="card flex flex-wrap items-center gap-4 p-4">
              {l.image ? (
                <Image src={l.image} alt={l.name} width={56} height={56} sizes="56px" className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 object-cover" unoptimized={l.image.endsWith(".svg")} />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"><Icon name="box" size={22} /></span>
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/producto/${l.slug}`} className="font-semibold text-slate-800 hover:text-navy">{l.name}</Link>
                <p className="mt-0.5 text-sm text-slate-500">{l.unitUsd.toFixed(2)} {t("cart.unit")}</p>
                {!ok && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><Icon name="info" size={13} /> {tt("cart.onlyLeft", { n: l.stock })}</p>}
              </div>
              <div className="flex items-center rounded-xl border border-slate-200">
                <button aria-label="Menos" onClick={() => setQty(l.productId, Math.max(1, qty - 1), l.variantId, l.stock)} className="grid h-10 w-10 place-items-center text-slate-500 hover:text-navy"><Icon name="minus" size={15} /></button>
                <span className="grid h-10 w-10 place-items-center border-x border-slate-200 text-sm font-semibold">{qty}</span>
                <button aria-label="Más" disabled={qty >= l.stock} onClick={() => setQty(l.productId, qty + 1, l.variantId, l.stock)} className="grid h-10 w-10 place-items-center text-slate-500 hover:text-navy disabled:cursor-not-allowed disabled:opacity-30"><Icon name="plus" size={15} /></button>
              </div>
              <p className="w-24 text-right font-display font-extrabold text-navy">{(l.unitUsd * qty).toFixed(2)} <span className="text-xs font-bold text-slate-400">USD</span></p>
              <button aria-label={t("cart.remove")} onClick={() => remove(l.productId, l.variantId)} className="grid h-10 w-10 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Icon name="trash" size={18} /></button>
            </div>
          )})}
        </div>

        <aside className="lg:sticky lg:top-24 lg:self-start">
          <div className="card p-5">
            <h2 className="font-display text-lg font-bold text-navy">{t("cart.summary")}</h2>
            <dl className="mt-4 space-y-2 text-sm">
              <div className="flex justify-between"><dt className="text-slate-500">{t("cart.subtotal")}</dt><dd className="font-semibold">{data ? data.subtotalUsd.toFixed(2) : "0.00"} USD</dd></div>
              <div className="flex justify-between"><dt className="text-slate-500">{t("cart.shipping")}</dt><dd className="text-slate-400">{t("cart.calcAtCheckout")}</dd></div>
              <div className="flex justify-between border-t border-slate-100 pt-3 text-base"><dt className="font-semibold">{t("cart.estimatedTotal")}</dt><dd className="font-display font-extrabold text-navy">{data ? data.subtotalUsd.toFixed(2) : "0.00"} USD</dd></div>
            </dl>
            {data?.allOk ? (
              <Link href="/checkout" className="btn btn-primary mt-5 w-full"><Icon name="check" size={18} /> {session === "out" ? "Inicia sesión para comprar" : t("cart.checkout")}</Link>
            ) : (
              <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{t("cart.adjust")}</p>
            )}
            <Link href="/catalogo" className="btn btn-ghost mt-2 w-full">{t("cart.keepShopping")}</Link>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400"><Icon name="shield" size={13} /> {t("cart.secure")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
