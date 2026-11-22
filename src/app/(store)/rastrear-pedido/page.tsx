"use client";
import { useState } from "react";
import Link from "next/link";
import Icon from "@/components/brand/Icon";

// Rastreo público: número de pedido + el contacto con el que se compró.
// Se piden los dos datos a propósito. Con solo el número, cualquiera podría ir
// probando 1, 2, 3… y ver nombres, teléfonos y direcciones de otros clientes.

export default function RastrearPedido() {
  const [numero, setNumero] = useState("");
  const [contacto, setContacto] = useState("");
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const buscar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = numero.replace(/\D/g, "");
    if (!n) return setError("Escribe el número de pedido, solo dígitos.");
    if (contacto.trim().length < 5) return setError("Escribe el correo o teléfono con el que hiciste el pedido.");

    setCargando(true);
    try {
      const r = await fetch("/api/pedidos/rastrear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: Number(n), contacto: contacto.trim() }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) {
        window.location.href = d.url;
        return;
      }
      setError(
        r.status === 429
          ? "Demasiados intentos. Espera un minuto y vuelve a probar."
          : d.error ?? "No encontramos un pedido con esos datos. Revisa el número y el contacto.",
      );
    } catch {
      setError("No se pudo conectar. Comprueba tu conexión e inténtalo otra vez.");
    } finally {
      setCargando(false);
    }
  };

  return (
    <div className="container-x py-10">
      <div className="mx-auto max-w-lg">
        <span className="eyebrow">Seguimiento</span>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-navy sm:text-4xl">Rastrea tu pedido</h1>
        <p className="mt-3 text-slate-600">
          Introduce el número de pedido y el correo o teléfono con el que compraste. Te mostramos por dónde va.
        </p>

        <form onSubmit={buscar} className="card mt-6 space-y-4 p-5 sm:p-6">
          <div>
            <label htmlFor="num" className="mb-1.5 block text-sm font-semibold text-navy">Número de pedido</label>
            <div className="relative">
              <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">#</span>
              <input
                id="num"
                inputMode="numeric"
                autoComplete="off"
                value={numero}
                onChange={(e) => setNumero(e.target.value)}
                placeholder="1024"
                className="input h-12 pl-9"
                aria-describedby="num-ayuda"
              />
            </div>
            <p id="num-ayuda" className="mt-1.5 text-xs text-slate-500">Está en el correo de confirmación y en el comprobante.</p>
          </div>

          <div>
            <label htmlFor="contacto" className="mb-1.5 block text-sm font-semibold text-navy">Correo o teléfono</label>
            <input
              id="contacto"
              value={contacto}
              onChange={(e) => setContacto(e.target.value)}
              placeholder="tucorreo@ejemplo.com"
              className="input h-12"
            />
          </div>

          {error && (
            <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
              <Icon name="info" size={16} className="mt-0.5 shrink-0" />{error}
            </p>
          )}

          <button type="submit" disabled={cargando} className="btn btn-accent h-12 w-full text-base disabled:opacity-60">
            {cargando ? <><Icon name="spinner" size={17} className="animate-spin" /> Buscando…</> : <><Icon name="search" size={17} /> Ver mi pedido</>}
          </button>
        </form>

        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 text-sm">
          <Link href="/cuenta" className="flex items-center gap-1.5 font-semibold text-[color:var(--color-action)] hover:underline">
            <Icon name="user" size={15} /> Ver todos mis pedidos
          </Link>
          <Link href="/contacto" className="flex items-center gap-1.5 text-slate-500 hover:text-navy">
            <Icon name="whatsapp" size={15} /> ¿Problemas? Escríbenos
          </Link>
        </div>
      </div>
    </div>
  );
}
