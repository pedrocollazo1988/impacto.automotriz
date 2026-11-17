"use client";
import { useState } from "react";
export default function VerifyBanner() {
  const [m, setM] = useState("");
  return <div className="rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm">Confirma tu correo para activar tus suscripciones y proteger tu cuenta. <button className="font-medium text-navy underline" onClick={async () => { const r = await fetch("/api/account/verify-resend", { method: "POST" }); setM(r.ok ? "Te enviamos un nuevo enlace." : "Intenta de nuevo en un minuto."); }}>Reenviar enlace</button> <span>{m}</span></div>;
}
