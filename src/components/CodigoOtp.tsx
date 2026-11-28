"use client";
import { useEffect, useRef } from "react";
import { usePreferences } from "@/components/site/Preferences";

/**
 * Seis casillas para el código de un solo uso. Mantiene el valor contiguo (sin
 * huecos), acepta pegar el código entero y avisa al padre cuando está completo.
 */
export default function CodigoOtp({ value, onChange, onComplete, error, disabled, autoFocus = true }: {
  value: string;
  onChange: (codigo: string) => void;
  onComplete?: (codigo: string) => void;
  error?: string;
  disabled?: boolean;
  autoFocus?: boolean;
}) {
  const { t } = usePreferences();
  const casillas = useRef<(HTMLInputElement | null)[]>([]);
  const completo = value.length === 6;

  useEffect(() => {
    if (autoFocus) casillas.current[Math.min(value.length, 5)]?.focus();
  }, [autoFocus, value.length]);

  useEffect(() => {
    if (completo) onComplete?.(value);
    // Solo al pasar a completo: si se repite con el mismo valor no se reenvía.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [completo]);

  const escribir = (i: number, texto: string) => {
    const digitos = texto.replace(/\D/g, "");
    if (!digitos) return;
    const siguiente = i >= value.length ? value + digitos : value.slice(0, i) + digitos + value.slice(i + 1);
    const recortado = siguiente.slice(0, 6);
    onChange(recortado);
    casillas.current[Math.min(recortado.length, 5)]?.focus();
  };

  const tecla = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      e.preventDefault();
      onChange(value.slice(0, Math.max(0, i)));
      casillas.current[Math.max(0, i - 1)]?.focus();
    } else if (e.key === "ArrowLeft") {
      e.preventDefault();
      casillas.current[Math.max(0, i - 1)]?.focus();
    } else if (e.key === "ArrowRight") {
      e.preventDefault();
      casillas.current[Math.min(5, i + 1)]?.focus();
    }
  };

  return (
    <div>
      <div className="flex justify-between gap-1.5" role="group" aria-label={t("otp.group")}>
        {Array.from({ length: 6 }, (_, i) => (
          <input
            key={i}
            ref={(el) => { casillas.current[i] = el; }}
            inputMode="numeric"
            pattern="[0-9]*"
            maxLength={1}
            disabled={disabled}
            value={value[i] ?? ""}
            aria-label={`${t("otp.digit")} ${i + 1}`}
            aria-invalid={!!error}
            autoComplete={i === 0 ? "one-time-code" : "off"}
            onChange={(e) => escribir(i, e.target.value)}
            onPaste={(e) => { e.preventDefault(); escribir(0, e.clipboardData.getData("text")); }}
            onKeyDown={(e) => tecla(i, e)}
            onFocus={(e) => e.target.select()}
            className={`h-13 w-full max-w-12 rounded-xl border text-center font-mono text-xl font-bold text-navy tabular-nums outline-none transition focus:border-[color:var(--color-action)] focus:ring-2 focus:ring-[color:var(--color-action)]/25 disabled:bg-slate-50 ${
              error ? "border-red-400 bg-red-50" : "border-slate-300 bg-white"
            }`}
            style={{ height: "3.25rem" }}
          />
        ))}
      </div>
      {error && <span className="mt-2 block text-xs text-red-600">{error}</span>}
    </div>
  );
}
