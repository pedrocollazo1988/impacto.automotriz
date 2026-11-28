"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useCart, type CartItem } from "@/components/CartProvider";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

type Line = { productId: number; variantId: number | null; slug: string | null; name: string | null; image: string | null; unitUsd: number; qty: number; stock: number; disponible: boolean; ok: boolean; totalUsd: number };
type Fila = { key: string; item: CartItem; line: Line | null };

export default function Carrito() {
  const { items, setQty, remove, clear, ttlHoras, expiresAt, ready, aviso } = useCart();
  const { t, lang } = usePreferences();
  const tt = (key: string, vars: Record<string, string | number>) => Object.entries(vars).reduce((txt, [k, v]) => txt.replace(`{${k}}`, String(v)), t(key));
  const [data, setData] = useState<{ lines: Line[]; subtotalUsd: number; allOk: boolean } | null>(null);
  const [loading, setLoading] = useState(true);
  const [failed, setFailed] = useState(false);
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
        .then((d) => { if (Array.isArray(d?.lines)) { setData(d); setFailed(false); } else setFailed(true); })
        .catch(() => { if (!ctrl.signal.aborted) setFailed(true); })
        .finally(() => { if (!ctrl.signal.aborted) setLoading(false); });
    }, 180);
    return () => { window.clearTimeout(t); ctrl.abort(); };
  }, [items]);
  const qtyDe = (l: Line) => items.find((i) => i.productId === l.productId && (i.variantId ?? null) === (l.variantId ?? null))?.qty ?? l.qty;
  const hasta = expiresAt ? new Date(expiresAt).toLocaleString(lang === "en" ? "en-US" : "es-CU", { dateStyle: "short", timeStyle: "short" }) : null;
  // Se pinta una fila por cada entrada guardada, aunque el servidor no la
  // devuelva: si el producto se retiró del catálogo hay que poder quitarlo.
  const filas: Fila[] = items.map((item) => ({
    key: `${item.productId}-${item.variantId ?? 0}`,
    item,
    line: data?.lines.find((l) => l.productId === item.productId && (l.variantId ?? null) === (item.variantId ?? null)) ?? null,
  }));
  const noDisponibles = filas.filter((f) => f.line && !f.line.disponible);
  const quitarNoDisponibles = () => noDisponibles.forEach((f) => remove(f.item.productId, f.item.variantId));
  const quitar = (item: CartItem) => (
    <button aria-label={t("cart.remove")} onClick={() => remove(item.productId, item.variantId)} className="grid h-10 w-10 shrink-0 place-items-center rounded-xl text-slate-400 transition hover:bg-red-50 hover:text-red-600"><Icon name="trash" size={18} /></button>
  );

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
          <span className="min-w-0 flex-1">{t("cart2.guestNotice")}</span>
          <Link href="/checkout" className="btn btn-primary btn-sm">{t("cart2.signIn")}</Link>
        </div>
      )}
      {noDisponibles.length > 0 && (
        <div className="mt-4 flex flex-wrap items-center gap-2 rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 text-sm text-amber-900">
          <Icon name="info" size={16} className="shrink-0" />
          <span className="min-w-0 flex-1">{tt("cart.unavailableBanner", { n: noDisponibles.length })}</span>
          <button onClick={quitarNoDisponibles} className="btn btn-ghost btn-sm">{t("cart.removeUnavailable")}</button>
        </div>
      )}
      {failed && (
        <p role="alert" className="mt-4 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{t("cart.priceError")}</p>
      )}
      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_360px]">
        <div className="space-y-3">
          {loading && <p className="text-sm text-slate-400" aria-live="polite">{t("cart.updating")}</p>}
          {filas.map(({ key, item, line }) => {
            if (!line) {
              if (loading) return <div key={key} className="card h-28 animate-pulse bg-slate-50" />;
              return (
                <div key={key} className="card flex flex-wrap items-center gap-4 border-amber-200 bg-amber-50/40 p-4">
                  <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><Icon name="info" size={22} /></span>
                  <div className="min-w-0 flex-1">
                    <p className="font-semibold text-slate-700">{t("cart.unavailable")}</p>
                    <p className="mt-0.5 text-sm text-slate-500">{tt("cart.unavailableRef", { id: item.productId })}</p>
                    <p className="mt-0.5 text-xs text-slate-400">{t("cart.unavailableHint")}</p>
                  </div>
                  <span className="text-sm font-semibold text-slate-500">× {item.qty}</span>
                  {quitar(item)}
                </div>
              );
            }
            if (!line.disponible) return (
              <div key={key} className="card flex flex-wrap items-center gap-4 border-amber-200 bg-amber-50/40 p-4">
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-amber-100 text-amber-600"><Icon name="info" size={22} /></span>
                <div className="min-w-0 flex-1">
                  <p className="font-semibold text-slate-700">{t("cart.unavailable")}</p>
                  <p className="mt-0.5 text-sm text-slate-500">{tt("cart.unavailableRef", { id: line.productId })}</p>
                  <p className="mt-0.5 text-xs text-slate-400">{t("cart.unavailableHint")}</p>
                </div>
                <span className="text-sm font-semibold text-slate-500">× {item.qty}</span>
                {quitar(item)}
              </div>
            );
            const qty = qtyDe(line);
            const ok = qty <= line.stock;
            return (
            <div key={key} className="card flex flex-wrap items-center gap-4 p-4">
              {line.image ? (
                <Image src={line.image} alt={line.name ?? ""} width={56} height={56} sizes="56px" className="h-14 w-14 shrink-0 rounded-xl bg-slate-100 object-cover" unoptimized={line.image.endsWith(".svg")} />
              ) : (
                <span className="grid h-14 w-14 shrink-0 place-items-center rounded-xl bg-gradient-to-br from-slate-100 to-slate-200 text-slate-400"><Icon name="box" size={22} /></span>
              )}
              <div className="min-w-0 flex-1">
                <Link href={`/producto/${line.slug}`} className="font-semibold text-slate-800 hover:text-navy">{line.name}</Link>
                <p className="mt-0.5 text-sm text-slate-500">{line.unitUsd.toFixed(2)} {t("cart.unit")}</p>
                {!ok && <p className="mt-1 flex items-center gap-1 text-xs font-medium text-red-600"><Icon name="info" size={13} /> {tt("cart.onlyLeft", { n: line.stock })}</p>}
              </div>
              <div className="flex items-center rounded-xl border border-slate-200">
                <button aria-label={t("cart2.qtyLess")} onClick={() => setQty(line.productId, Math.max(1, qty - 1), line.variantId, line.stock)} className="grid h-10 w-10 place-items-center text-slate-500 hover:text-navy"><Icon name="minus" size={15} /></button>
                <span className="grid h-10 w-10 place-items-center border-x border-slate-200 text-sm font-semibold">{qty}</span>
                <button aria-label={t("cart2.qtyMore")} disabled={qty >= line.stock} onClick={() => setQty(line.productId, qty + 1, line.variantId, line.stock)} className="grid h-10 w-10 place-items-center text-slate-500 hover:text-navy disabled:cursor-not-allowed disabled:opacity-30"><Icon name="plus" size={15} /></button>
              </div>
              <p className="w-24 text-right font-display font-extrabold text-navy">{(line.unitUsd * qty).toFixed(2)} <span className="text-xs font-bold text-slate-400">USD</span></p>
              {quitar(item)}
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
              <Link href="/checkout" className="btn btn-primary mt-5 w-full"><Icon name="check" size={18} /> {session === "out" ? t("cart2.signInToBuy") : t("cart.checkout")}</Link>
            ) : (
              <p className="mt-5 rounded-lg bg-amber-50 p-3 text-sm text-amber-700">{t("cart.adjust")}</p>
            )}
            <Link href="/catalogo" className="btn btn-ghost mt-2 w-full">{t("cart.keepShopping")}</Link>
            <button onClick={clear} className="mt-3 w-full text-center text-xs font-semibold text-slate-400 underline-offset-2 hover:text-red-600 hover:underline">{t("cart.clear")}</button>
            <p className="mt-4 flex items-center justify-center gap-1.5 text-xs text-slate-400"><Icon name="shield" size={13} /> {t("cart.secure")}</p>
          </div>
        </aside>
      </div>
    </div>
  );
}
