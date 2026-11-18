"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";
export default function VerifyBanner() {
  const [m, setM] = useState("");
  return (
    <div className="card flex flex-wrap items-center gap-3 border-amber-200 bg-amber-50 p-4 text-sm text-amber-800">
      <Icon name="mail" size={18} />
      <span className="flex-1">Confirma tu correo para activar tus suscripciones y proteger tu cuenta.</span>
      <button className="btn btn-ghost h-9 border-amber-300 px-3 text-xs text-amber-800" onClick={async () => { const r = await fetch("/api/account/verify-resend", { method: "POST" }); setM(r.ok ? "Te enviamos un nuevo enlace." : "Intenta de nuevo en un minuto."); }}>Reenviar enlace</button>
      {m && <span className="w-full text-xs">{m}</span>}
    </div>);
}
