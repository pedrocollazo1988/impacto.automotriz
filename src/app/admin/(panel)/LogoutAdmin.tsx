"use client";
import Icon from "@/components/brand/Icon";
export default function LogoutAdmin() {
  return <button className="btn btn-ghost btn-sm" onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); location.href = "/admin/login"; }}><Icon name="close" size={15} /> Salir</button>;
}
