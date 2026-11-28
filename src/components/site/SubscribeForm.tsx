"use client";

import { useState } from "react";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

type Estado = "idle" | "loading" | "ok" | "error";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

export default function SubscribeForm() {
  const { t } = usePreferences();
  const [email, setEmail] = useState("");
  const [estado, setEstado] = useState<Estado>("idle");
  const [mensaje, setMensaje] = useState("");

  const enviar = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (estado === "loading") return;

    const valor = email.trim();
    if (!EMAIL_RE.test(valor)) {
      setEstado("error");
      setMensaje(t("subs.invalidEmail"));
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
        setMensaje(data?.error ?? t("subs.error"));
        return;
      }

      setEstado("ok");
      setMensaje(t("subs.checkEmail"));
      setEmail("");
    } catch {
      setEstado("error");
      setMensaje(t("subs.networkError"));
    }
  };

  const cargando = estado === "loading";

  return (
    <form onSubmit={enviar} className="w-full" noValidate aria-busy={cargando}>
      <div className="flex flex-col gap-2 sm:flex-row">
        <label htmlFor="blog-subscribe-email" className="sr-only">
          {t("subs.emailLabel")}
        </label>
        <input
          id="blog-subscribe-email"
          className="input min-h-12 flex-1"
          type="email"
          name="email"
          inputMode="email"
          autoComplete="email"
          placeholder={t("subs.placeholder")}
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
              {t("subs.sending")}
            </>
          ) : (
            <>
              <Icon name="mail" size={16} />
              {t("subs.submit")}
            </>
          )}
        </button>
      </div>

      <p id="blog-subscribe-help" className="mt-2 text-xs leading-relaxed text-slate-500">
        {t("subs.help")}
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
