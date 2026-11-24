"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function ReviewForm({ productId }: { productId: number }) {
  const router = useRouter(); const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [msg, setMsg] = useState(""); const [err, setErr] = useState(""); const [busy, setBusy] = useState(false);
  const publicar = async () => {
    setErr(""); setMsg("");
    if (comment.trim().length < 3) return setErr("Escribe al menos 3 caracteres en tu reseña.");
    setBusy(true);
    const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, rating, comment }) });
    setBusy(false);
    if (r.ok) { setMsg("¡Gracias! Tu reseña se publicó."); setComment(""); router.refresh(); }
    else setErr((await r.json()).error ?? "No se pudo publicar la reseña.");
  };
  return (
    <div className="card space-y-3 p-4 text-sm">
      <b className="font-display text-navy">Valora este producto</b>
      <select className="input-select w-40" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
      <textarea className="input min-h-20" rows={3} placeholder="Cuéntanos tu experiencia" value={comment} onChange={(e) => setComment(e.target.value)} aria-invalid={!!err} />
      <div className="flex flex-wrap items-center gap-3">
        <button className="btn btn-primary" disabled={busy} onClick={publicar}>{busy ? "Publicando…" : "Publicar reseña"}</button>
        {err && <span role="alert" className="text-xs text-red-600">{err}</span>}
        {msg && <span role="status" className="text-xs text-emerald-700">{msg}</span>}
      </div>
    </div>);
}
