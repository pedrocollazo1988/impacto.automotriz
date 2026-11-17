"use client";
import { useRouter } from "next/navigation";
export default function ReviewToggle({ id, visible }: { id: number; visible: boolean }) {
  const router = useRouter();
  return <button className="text-navy underline" onClick={async () => { await fetch("/api/admin/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, visible: !visible }) }); router.refresh(); }}>{visible ? "Ocultar" : "Mostrar"}</button>;
}
