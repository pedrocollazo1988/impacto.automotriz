"use client";
import { useState } from "react";
export default function WishlistButton({ productId, initial }: { productId: number; initial: boolean }) {
  const [on, setOn] = useState(initial);
  return <button className="rounded-lg border px-4 py-2 text-sm" onClick={async () => {
    const r = await fetch(on ? `/api/account/wishlist?productId=${productId}` : "/api/account/wishlist", { method: on ? "DELETE" : "POST", headers: { "Content-Type": "application/json" }, body: on ? undefined : JSON.stringify({ productId }) });
    if (r.status === 401) location.href = "/cuenta"; else if (r.ok) setOn(!on);
  }}>{on ? "♥ En tu lista de deseos" : "♡ Añadir a deseos"}</button>;
}
