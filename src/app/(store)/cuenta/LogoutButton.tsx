"use client";
export default function LogoutButton() { return <button className="text-sm text-slate-600 underline" onClick={async () => { await fetch("/api/account/session", { method: "DELETE" }); location.href = "/"; }}>Cerrar sesión</button>; }
