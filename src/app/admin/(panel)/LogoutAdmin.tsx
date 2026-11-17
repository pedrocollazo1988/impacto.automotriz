"use client";
export default function LogoutAdmin() { return <button onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); location.href = "/admin/login"; }}>Salir</button>; }
