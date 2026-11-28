"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Turnstile from "@/components/Turnstile";
import { usePreferences } from "@/components/site/Preferences";
export default function ReviewForm({ productId }: { productId: number }) {
  const router = useRouter();
  const { t } = usePreferences();
  const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const [captcha, setCaptcha] = useState(""); const [captchaKey, setCaptchaKey] = useState(0);
  const publicar = async () => {
    setErr(""); setMsg("");
    if (comment.trim().length < 3) return setErr(t("review.errShort"));
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha) return setErr(t("review.errCaptcha"));
    setBusy(true);
    const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, rating, comment, turnstileToken: captcha }) });
    setBusy(false);
    if (r.ok) { setMsg(t("review.thanks")); setComment(""); setCaptcha(""); setCaptchaKey((k) => k + 1); router.refresh(); }
    else { setCaptcha(""); setCaptchaKey((k) => k + 1); setErr((await r.json()).error ?? t("review.errPublish")); }
  };
  return (
    <div className="card space-y-3 p-4 text-sm">
      <b className="font-display text-navy">{t("review.title")}</b>
      <select className="input-select w-40" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
      <textarea className="input min-h-20" rows={3} placeholder={t("review.placeholder")} value={comment} onChange={(e) => setComment(e.target.value)} aria-invalid={!!err} />
      <Turnstile key={captchaKey} onToken={setCaptcha} />
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={busy} onClick={publicar}>{busy ? t("review.publishing") : t("review.publish")}</button>
        {err && <span role="alert" className="text-xs text-red-600">{err}</span>}
        {msg && <span role="status" className="text-xs text-emerald-700">{msg}</span>}
      </div>
    </div>);
}
