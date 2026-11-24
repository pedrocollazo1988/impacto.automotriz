"use client";
import { useState } from "react";
import Icon from "@/components/brand/Icon";
import Turnstile from "@/components/Turnstile";
import { waHref } from "@/lib/site";

// La reclamación no se guarda en la base de datos: el negocio atiende la
// garantía por WhatsApp. Lo que sí se hace aquí es comprobar que el pedido
// existe y que quien reclama es quien compró, para que el mensaje salga con
// los datos correctos y no haya que pedirlos otra vez por chat.

const MOTIVOS = [
  ["defecto", "La pieza llegó defectuosa"],
  ["no-encaja", "No encaja en mi vehículo"],
  ["danada", "Llegó dañada en el transporte"],
  ["equivocada", "No es la pieza que pedí"],
  ["otro", "Otro motivo"],
] as const;

export default function GarantiaForm() {
  const [numero, setNumero] = useState("");
  const [contacto, setContacto] = useState("");
  const [motivo, setMotivo] = useState<string>(MOTIVOS[0][0]);
  const [detalle, setDetalle] = useState("");
  const [validado, setValidado] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [cargando, setCargando] = useState(false);
  const [captcha, setCaptcha] = useState(""); const [captchaKey, setCaptchaKey] = useState(0);

  const validar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    const n = numero.replace(/\D/g, "");
    if (!n) return setError("Escribe el número de pedido.");
    if (contacto.trim().length < 5) return setError("Escribe el correo o teléfono con el que compraste.");
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha) return setError("Completa la verificación anti-bots.");

    setCargando(true);
    try {
      const r = await fetch("/api/pedidos/rastrear", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ numero: Number(n), contacto: contacto.trim(), turnstileToken: captcha }),
      });
      const d = await r.json().catch(() => ({}));
      if (r.ok && d.url) {
        setValidado(d.url);
        return;
      }
      setCaptcha(""); setCaptchaKey((k) => k + 1);
      setError(r.status === 429 ? "Demasiados intentos. Espera un minuto." : d.error ?? "No encontramos ese pedido.");
    } catch {
      setError("No se pudo conectar. Inténtalo otra vez.");
    } finally {
      setCargando(false);
    }
  };

  const texto = () => {
    const m = MOTIVOS.find(([k]) => k === motivo)?.[1] ?? "Otro motivo";
    return [
      `Hola, quiero reclamar la garantía del pedido #${numero.replace(/\D/g, "")}.`,
      `Motivo: ${m}.`,
      detalle.trim() ? `Detalle: ${detalle.trim()}` : "",
      `Contacto: ${contacto.trim()}`,
    ].filter(Boolean).join("\n");
  };

  if (validado) {
    return (
      <div className="card p-5 sm:p-6">
        <p className="flex items-center gap-2 rounded-xl bg-[color:var(--color-ok)]/10 px-3.5 py-3 text-sm font-semibold text-emerald-800">
          <Icon name="check" size={17} /> Pedido #{numero.replace(/\D/g, "")} verificado
        </p>

        <div className="mt-5 space-y-4">
          <div>
            <label htmlFor="motivo" className="mb-1.5 block text-sm font-semibold text-navy">¿Qué pasó?</label>
            <select id="motivo" value={motivo} onChange={(e) => setMotivo(e.target.value)} className="input-select h-12">
              {MOTIVOS.map(([k, t]) => <option key={k} value={k}>{t}</option>)}
            </select>
          </div>
          <div>
            <label htmlFor="detalle" className="mb-1.5 block text-sm font-semibold text-navy">Cuéntanos un poco más</label>
            <textarea
              id="detalle"
              rows={4}
              value={detalle}
              onChange={(e) => setDetalle(e.target.value)}
              placeholder="Por ejemplo: el rodamiento hace ruido al girar desde el primer día."
              className="input resize-y"
            />
          </div>

          <a
            href={waHref(texto())}
            target="_blank"
            rel="noopener"
            className="btn btn-accent h-12 w-full text-base"
          >
            <Icon name="whatsapp" size={18} /> Enviar la reclamación por WhatsApp
          </a>
          <p className="text-center text-xs text-slate-500">
            Se abrirá WhatsApp con el mensaje ya escrito. Solo tienes que enviarlo.
          </p>
          <button type="button" onClick={() => setValidado(null)} className="btn btn-ghost w-full">
            <Icon name="chevronLeft" size={15} /> Usar otro pedido
          </button>
        </div>
      </div>
    );
  }

  return (
    <form onSubmit={validar} className="card space-y-4 p-5 sm:p-6">
      <div>
        <label htmlFor="gnum" className="mb-1.5 block text-sm font-semibold text-navy">Número de pedido</label>
        <div className="relative">
          <span aria-hidden className="pointer-events-none absolute left-4 top-1/2 -translate-y-1/2 text-sm font-bold text-slate-400">#</span>
          <input id="gnum" inputMode="numeric" autoComplete="off" value={numero} onChange={(e) => setNumero(e.target.value)} placeholder="1024" className="input h-12 pl-9" />
        </div>
      </div>
      <div>
        <label htmlFor="gcontacto" className="mb-1.5 block text-sm font-semibold text-navy">Correo o teléfono de la compra</label>
        <input id="gcontacto" value={contacto} onChange={(e) => setContacto(e.target.value)} placeholder="tucorreo@ejemplo.com" className="input h-12" />
      </div>

      {error && (
        <p role="alert" className="flex items-start gap-2 rounded-xl bg-red-50 px-3.5 py-3 text-sm text-red-700">
          <Icon name="info" size={16} className="mt-0.5 shrink-0" />{error}
        </p>
      )}

      <Turnstile key={captchaKey} onToken={setCaptcha} />
      <button type="submit" disabled={cargando} className="btn btn-accent h-12 w-full text-base disabled:opacity-60">
        {cargando ? <><Icon name="spinner" size={17} className="animate-spin" /> Comprobando…</> : <><Icon name="shield" size={17} /> Comprobar mi pedido</>}
      </button>
      <p className="text-center text-xs text-slate-500">Comprobamos que el pedido existe antes de abrir la reclamación.</p>
    </form>
  );
}
