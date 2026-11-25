"use client";

import { useState } from "react";
import Icon from "@/components/brand/Icon";

type Estado = "idle" | "loading" | "ok" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SubscribeForm() {
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensaje, setMensaje] = useState("");

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (estado === "loading") return;

    const valor = email.trim();
    if (!EMAIL_RE.test(valor)) {
      setEstado("error");
      setMensaje("Escribe un correo válido, por ejemplo nombre@correo.com.");
      return;
    }

    setEstado("loading");
    setMensaje("");

    try {
      const r = await fetch("/api/email/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: valor }),
      });
      const data = (await r.json().catch(() => null)) as { error?: string } | null;

      if (!r.ok) {
        setEstado("error");
        setMensaje(data?.error ?? "No pudimos completar la suscripción. Inténtalo de nuevo.");
        return;
      }

      setEstado("ok");
      setMensaje("Casi listo: revisa tu correo y confirma la suscripción.");
      setEmail("");
    } catch {
      setEstado("error");
      setMensaje("No pudimos conectar con el servidor. Revisa tu conexión e inténtalo de nuevo.");
    }
  };

  const cargando = estado === "loading";

  return (
    <form onSubmit={enviar} className="w-full" noValidate aria-busy={cargando}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="blog-subscribe-email" className="sr-only">
          Correo electrónico
        </label>
        <input
          id="blog-subscribe-email"
          className="input min-h-12 flex-1"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder="tu@correo.com"
          value={email}
          onChange={(e) => {
            setEmail(e.target.value);
            if (estado !== "loading") {
              setEstado("idle");
              setMensaje("");
            }
          }}
          aria-invalid={estado === "error"}
          aria-describedby="blog-subscribe-help blog-subscribe-message"
          disabled={cargando}
        />
        <button type="submit" className="btn btn-primary min-h-12 shrink-0 disabled:opacity-60" disabled={cargando}>
          {cargando ? (
            <>
              <Icon name="spinner" size={16} className="animate-spin" />
              Enviando…
            </>
          ) : (
            <>
              <Icon name="mail" size={16} />
              Suscribirme
            </>
          )}
        </button>
      </div>

      <p id="blog-subscribe-help" className="mt-2 text-xs leading-relaxed text-slate-500">
        Te enviaremos un correo para confirmar la suscripción. Puedes darte de baja cuando quieras.
      </p>

      <p
        id="blog-subscribe-message"
        role="status"
        aria-live="polite"
        className={`mt-2 rounded-lg p-3 text-sm ${
          estado === "error"
            ? "bg-red-50 text-red-700"
            : estado === "ok"
              ? "bg-emerald-50 text-emerald-800"
              : "hidden"
        }`}
      >
        {mensaje}
      </p>
    </form>
  );
}
