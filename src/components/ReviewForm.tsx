"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
export default function ReviewForm({ productId }: { productId: number }) {
  const router = useRouter(); const [rating, setRating] = useState(5); const [comment, setComment] = useState(""); const [msg, setMsg] = useState("");
  return (
    <div className="space-y-2 rounded-lg border p-3 text-sm"><b>Valora este producto</b>
      <select className="ml-2 rounded border px-2 py-1" value={rating} onChange={(e) => setRating(Number(e.target.value))}>{[5, 4, 3, 2, 1].map((n) => <option key={n} value={n}>{"★".repeat(n)}</option>)}</select>
      <textarea className="w-full rounded border p-2" rows={3} placeholder="Cuéntanos tu experiencia" value={comment} onChange={(e) => setComment(e.target.value)} />
      <button className="rounded bg-navy px-4 py-1.5 text-white" onClick={async () => { const r = await fetch("/api/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId, rating, comment }) }); if (r.ok) { setMsg("¡Gracias!"); router.refresh(); } else setMsg((await r.json()).error); }}>Publicar</button>
      <span className="ml-2">{msg}</span></div>);
}
