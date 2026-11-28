"use client";
import { useState } from "react";
import { usePreferences } from "@/components/site/Preferences";
export default function PayRetry({ orderId }: { orderId: string }) {
  const { t } = usePreferences();
  const [err, setErr] = useState("");
  return <div><button className="rounded-lg bg-navy px-6 py-2.5 font-semibold text-white" onClick={async () => {
    const r = await fetch("/api/payments/retry", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ orderId }) });
    const j = await r.json(); if (j.paymentUrl) window.location.href = j.paymentUrl; else setErr(j.error ?? t("order.payError"));
  }}>{t("order.payNow")}</button>{err && <p className="mt-2 text-sm text-red-600">{err}</p>}</div>;
}
