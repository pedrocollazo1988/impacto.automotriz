"use client";
import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import Turnstile from "@/components/Turnstile";
import { usePreferences } from "@/components/site/Preferences";

// Rastreo público: número de pedido + el contacto con el que se compró.
// Se piden los dos datos a propósito. Con solo el número, cualquiera podría ir
// probando 1, 2, 3… y ver nombres, teléfonos y direcciones de otros clientes.

export default function RastrearPedido() {
  const { t } = usePreferences();
  const [numero, setNumero] = useState("");
  const [contacto, setContacto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [captcha, setCaptcha] = useState(""); const [captchaKey, setCaptchaKey] = useState(0);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = numero.replace(/\D/g, "");
    if (!n) return setError(t("track.errNumero"));
    if (contacto.trim().length < 5) return setError(t("track.errContacto"));
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha) return setError(t("track.errCaptcha"));

    setCargando(true);
    try {
      const r = await fetch("/api/pedidos/rastrear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: n, contacto: contacto.trim(), turnstileToken: captcha }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) {
        window.location.href = d.url;
        return;
      }
      setCaptcha(""); setCaptchaKey((k) => k + 1);
      setError(
        r.status === 429
          ? t("track.err429")
          : d.error ?? t("track.errNoEncontrado"),
      );
    } catch {
      setError(t("track.errConexion"));
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-lg">
        <span className="eyebrow">{t("track.eyebrow")}</span>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-navy sm:text-4xl">{t("track.title")}</h1>
        <p className="mt-3 text-slate-600">
          {t("track.intro")}
        </p>

        <form onSubmit={buscar} className="card mt-6 space-y-4 p-5 sm:p-6">
          <div>
            <label htmlFor="num" className="mb-1.5 block text-sm font-semibold text-navy">{t("track.numLabel")}</label>
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">#</span>
              <input
                id="num"
                inputMode="numeric"
                autoComplete="off"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder={t("track.numPlaceholder")}
                className="input h-12 pl-9"
                aria-describedby="num-ayuda"
              />
            </div>
            <p id="num-ayuda" className="mt-1.5 text-xs text-slate-500">{t("track.numHint")}</p>
          </div>

          <div>
            <label htmlFor="contacto" className="mb-1.5 block text-sm font-semibold text-navy">{t("track.contactoLabel")}</label>
            <input
              id="contacto"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder={t("track.emailPlaceholder")}
              className="input h-12"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <Icon name="info" size={16} className="mt-0.5 shrink-0" />{error}
            </p>
          )}

          <Turnstile key={captchaKey} onToken={setCaptcha} />
          <button type="submit" disabled={cargando} className="btn btn-accent h-12 w-full text-base disabled:opacity-60">
            {cargando ? <><Icon name="spinner" size={17} className="animate-spin" /> {t("track.buscando")}</> : <><Icon name="search" size={17} /> {t("track.verPedido")}</>}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/cuenta" className="flex items-center gap-1.5 font-semibold text-[color:var(--color-action)] hover:underline">
            <Icon name="user" size={15} /> {t("track.misPedidos")}
          </Link>
          <Link href="/contacto" className="flex items-center gap-1.5 text-slate-500 hover:text-navy">
            <Icon name="whatsapp" size={15} /> {t("track.ayuda")}
          </Link>
        </div>
      </div>
    </div>
  );
}
