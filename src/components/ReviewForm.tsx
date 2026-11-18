"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function ReviewForm({ productId }: { productId: number }) {
  const router = useRouter(); const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [msg, setMsg] = useState("");
  return (
    <div className="card space-y-3 p-4 text-sm">
      <b className="font-display text-navy">Valora este producto</b>
      <select className="input-select w-40" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
      <textarea className="input min-h-20" rows={3} placeholder="Cuéntanos tu experiencia" value={comment} onChange={(e) => setComment(e.target.value)} />
      <div className="flex items-center gap-3">
        <button className="btn btn-primary" onClick={async () => { const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, rating, comment }) }); if (r.ok) { setMsg("¡Gracias!"); router.refresh(); } else setMsg((await r.json()).error); }}>Publicar reseña</button>
        {msg && <span className="text-slate-500">{msg}</span>}
      </div>
    </div>);
}
