"use client";

import { useCallback, useEffect, useId, useRef, useState } from "react";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

type Estado = "cargando" | "listo" | "comprobando" | "ok" | "error";

export type CaptchaValue = { token: string; answer: string; ok: boolean };

type Props = {
  onChange?: (v: CaptchaValue) => void;
  error?: string;
  label?: string;
};

const LARGO = 4;
const normalizar = (v: string) => v.replace(/[^a-z0-9]/gi, "").toUpperCase().slice(0, LARGO);

export default function Captcha({ onChange, error, label }: Props) {
  const { t } = usePreferences();
  const etiqueta = label ?? t("captcha.label");
  const [token, setToken] = useState("");
  const [svg, setSvg] = useState("");
  const [answer, setAnswer] = useState("");
  const [estado, setEstado] = useState<Estado>("cargando");
  const [mensaje, setMensaje] = useState("");

  const inputRef = useRef<HTMLInputElement>(null);
  const ultimaComprobada = useRef("");
  const carga = useRef(0);
  const peticion = useRef(0);
  const focoPendiente = useRef(false);
  const onChangeRef = useRef(onChange);
  // `t` cambia cuando el visitante cambia de idioma; los callbacks estables lo leen al vuelo.
  const tRef = useRef(t);
  tRef.current = t;

  const uid = useId();
  const inputId = `${uid}-input`;
  const ayudaId = `${uid}-ayuda`;
  const estadoId = `${uid}-estado`;
  const errorId = `${uid}-error`;

  const cargar = useCallback(async () => {
    const id = ++carga.current;
    peticion.current++;
    ultimaComprobada.current = "";
    setEstado("cargando");
    setMensaje("");
    setAnswer("");
    setToken("");
    setSvg("");
    try {
      const r = await fetch("/api/captcha", { cache: "no-store" });
      const j = (await r.json().catch(() => null)) as { token?: unknown; svg?: unknown; error?: unknown } | null;
      if (id !== carga.current) return;
      if (!r.ok || typeof j?.token !== "string" || typeof j?.svg !== "string") {
        throw new Error(typeof j?.error === "string" ? j.error : tRef.current("captcha.loadError"));
      }
      setToken(j.token);
      setSvg(j.svg);
      setEstado("listo");
    } catch (e) {
      if (id !== carga.current) return;
      setEstado("error");
      setMensaje(e instanceof Error ? e.message : tRef.current("captcha.loadError"));
    }
  }, []);

  useEffect(() => {
    void cargar();
  }, [cargar]);

  useEffect(() => {
    onChangeRef.current = onChange;
  });

  useEffect(() => {
    onChangeRef.current?.({ token, answer, ok: estado === "ok" });
  }, [token, answer, estado]);

  useEffect(() => {
    if (focoPendiente.current && estado === "listo") {
      focoPendiente.current = false;
      inputRef.current?.focus();
    }
  }, [estado]);

  const verificar = useCallback(
    async (valor: string) => {
      const limpio = normalizar(valor);
      if (limpio.length !== LARGO || !token) return;
      const clave = `${token}:${limpio}`;
      if (ultimaComprobada.current === clave) return;
      ultimaComprobada.current = clave;
      const id = ++peticion.current;
      setEstado("comprobando");
      setMensaje(tRef.current("captcha.checking"));
      try {
        const r = await fetch("/api/captcha/verify", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token, answer: limpio }),
          cache: "no-store",
        });
        if (id !== peticion.current) return;
        if (!r.ok) throw new Error("invalid-response");
        const j = (await r.json().catch(() => null)) as { ok?: unknown } | null;
        if (id !== peticion.current) return;
        if (!j) throw new Error("invalid-response");
        if (j.ok === true) {
          setEstado("ok");
          setMensaje(tRef.current("captcha.ok"));
        } else {
          setEstado("error");
          setMensaje(tRef.current("captcha.mismatch"));
        }
      } catch {
        if (id !== peticion.current) return;
        ultimaComprobada.current = ""; // permite reintentar el mismo código
        setEstado("error");
        setMensaje(tRef.current("captcha.verifyError"));
      }
    },
    [token],
  );

  const cambiar = (raw: string) => {
    const limpio = normalizar(raw);
    peticion.current++; // invalida cualquier comprobación en curso
    setAnswer(limpio);
    if (estado !== "listo") {
      setEstado("listo");
      setMensaje("");
    }
    if (limpio.length === LARGO) void verificar(limpio);
  };

  const refrescar = async () => {
    focoPendiente.current = true;
    await cargar();
  };

  const invalido = Boolean(error) || estado === "error";
  const descrito = [error ? errorId : null, ayudaId, estadoId].filter(Boolean).join(" ");
  const colorEstado =
    estado === "ok" ? "text-emerald-700" : estado === "error" ? "text-red-600" : "text-slate-500";

  return (
    <div className="w-full">
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-sm font-semibold text-slate-700">
          {etiqueta}
        </label>
        <button
          type="button"
          onClick={() => void refrescar()}
          disabled={estado === "cargando"}
          className="btn btn-ghost btn-xs disabled:opacity-50"
          aria-label={t("captcha.regen")}
        >
          <Icon name="refresh" size={14} /> {t("captcha.other")}
        </button>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <div
          className="h-16 w-[180px] shrink-0 overflow-hidden rounded-xl border border-slate-200 bg-white"
          aria-busy={estado === "cargando"}
        >
          {svg ? (
            <div className="h-full w-full" dangerouslySetInnerHTML={{ __html: svg }} />
          ) : (
            <span className="flex h-full items-center justify-center text-xs text-slate-400">
              {estado === "cargando" ? t("captcha.loading") : t("captcha.none")}
            </span>
          )}
        </div>

        <div className="min-w-0 flex-1 basis-32">
          <input
            ref={inputRef}
            id={inputId}
            className={`input text-center font-mono text-lg font-bold uppercase tracking-[0.4em] ${
              invalido ? "border-red-400 ring-2 ring-red-100" : ""
            }`}
            value={answer}
            onChange={(e) => cambiar(e.target.value)}
            onBlur={() => {
              if (answer.length === LARGO) void verificar(answer);
            }}
            maxLength={LARGO}
            inputMode="text"
            autoComplete="off"
            autoCapitalize="characters"
            autoCorrect="off"
            spellCheck={false}
            placeholder="····"
            aria-invalid={invalido}
            aria-describedby={descrito}
            disabled={!token || estado === "cargando"}
          />
        </div>
      </div>

      <p id={ayudaId} className="mt-1.5 text-xs text-slate-500">
        {t("captcha.help")}
      </p>
      <p
        id={estadoId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className={`mt-1 flex min-h-5 items-center gap-1.5 text-xs font-medium ${colorEstado}`}
      >
        {estado === "comprobando" && <Icon name="spinner" size={14} className="animate-spin" />}
        {estado === "ok" && <Icon name="check" size={14} />}
        {estado === "error" && <Icon name="info" size={14} />}
        <span>{mensaje || " "}</span>
      </p>
      {error && (
        <p id={errorId} role="alert" className="mt-1 text-xs font-medium text-red-600">
          {error}
        </p>
      )}
    </div>
  );
}
