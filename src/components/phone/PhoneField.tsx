"use client";
import { useEffect, useMemo, useRef, useState } from "react";
import PhoneInput, { getCountryCallingCode, type Country } from "react-phone-number-input";
import etiquetasEs from "react-phone-number-input/locale/es.json";
import etiquetasEn from "react-phone-number-input/locale/en.json";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";
import { paisDelNavegador } from "@/lib/phone";

type Opcion = { value?: Country; label: string; divider?: boolean };

// El país elegido sobrevive a desmontar el campo (cambio de pestaña del formulario).
let ultimoPais: Country | undefined;

const bandera = (pais?: Country) =>
  pais ? String.fromCodePoint(...[...pais].map((c) => 0x1f1e6 + c.charCodeAt(0) - 65)) : "🌐";

const sinAcentos = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase();

/** Lista de países con buscador: el <select> nativo no permite escribir. */
function SelectorPais(props: { value?: Country; options: Opcion[]; onChange: (pais: Country) => void; disabled?: boolean }) {
  const { t } = usePreferences();
  const [abierto, setAbierto] = useState(false);
  const [q, setQ] = useState("");
  const caja = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    const escape = (e: KeyboardEvent) => { if (e.key === "Escape") setAbierto(false); };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", escape);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", escape); };
  }, [abierto]);

  const opciones = useMemo(
    () => props.options.filter((o) => o.value && (!q || sinAcentos(o.label).includes(sinAcentos(q)) || `+${getCountryCallingCode(o.value)}`.includes(q))),
    [props.options, q],
  );

  return (
    <div className="relative shrink-0" ref={caja}>
      <button
        type="button"
        disabled={props.disabled}
        onClick={() => setAbierto((v) => !v)}
        aria-haspopup="listbox"
        aria-expanded={abierto}
        aria-label={t("phone.country")}
        className="flex h-full min-h-11 items-center gap-1 rounded-l-xl border border-r-0 border-slate-300 bg-slate-50 px-2.5 text-sm font-semibold text-navy transition hover:bg-slate-100 focus-visible:outline-2"
      >
        <span aria-hidden className="text-base leading-none">{bandera(props.value)}</span>
        <span className="tabular-nums">{props.value ? `+${getCountryCallingCode(props.value)}` : "—"}</span>
        <Icon name="chevronRight" size={12} className="rotate-90 opacity-60" />
      </button>

      {abierto && (
        <div className="absolute left-0 top-full z-50 mt-1 w-72 overflow-hidden rounded-xl border border-slate-200 bg-white shadow-[var(--shadow-lift)]">
          <div className="border-b border-slate-100 p-2">
            <input
              autoFocus
              value={q}
              onChange={(e) => setQ(e.target.value)}
              placeholder={t("phone.search")}
              className="w-full rounded-lg border border-slate-200 px-2.5 py-1.5 text-sm outline-none focus:border-[color:var(--color-action)] focus:ring-2 focus:ring-[color:var(--color-action)]/20"
              aria-label={t("phone.search")}
            />
          </div>
          <ul role="listbox" aria-label={t("phone.country")} className="max-h-64 overflow-y-auto py-1">
            {opciones.map((o) => (
              <li key={o.value}>
                <button
                  type="button"
                  role="option"
                  aria-selected={o.value === props.value}
                  onClick={() => { props.onChange(o.value!); setAbierto(false); setQ(""); }}
                  className={`flex w-full items-center gap-2 px-3 py-1.5 text-left text-sm transition hover:bg-slate-100 ${o.value === props.value ? "font-semibold text-[color:var(--color-action-deep)]" : "text-slate-700"}`}
                >
                  <span aria-hidden className="text-base leading-none">{bandera(o.value)}</span>
                  <span className="flex-1 truncate">{o.label}</span>
                  <span className="tabular-nums text-xs text-slate-500">+{o.value ? getCountryCallingCode(o.value) : ""}</span>
                </button>
              </li>
            ))}
            {opciones.length === 0 && <li className="px-3 py-6 text-center text-sm text-slate-500">{t("phone.noResults")}</li>}
          </ul>
        </div>
      )}
    </div>
  );
}

/**
 * Campo de teléfono con selector de país (bandera, nombre traducido, prefijo),
 * buscador y detección del país del navegador la primera vez. El valor que sale
 * es siempre E.164 (+5355551234) o cadena vacía.
 */
export default function PhoneField({ value, onChange, error, autoComplete = "tel", autoFocus }: {
  value: string;
  onChange: (e164: string) => void;
  error?: string;
  autoComplete?: string;
  autoFocus?: boolean;
}) {
  const { lang, t } = usePreferences();
  const [pais, setPais] = useState<Country>(() => ultimoPais ?? (paisDelNavegador() as Country));

  return (
    <div>
      <div className={`flex items-stretch rounded-xl ${error ? "ring-2 ring-red-100" : ""}`}>
        <PhoneInput
          international={false}
          defaultCountry={pais}
          onCountryChange={(p) => { if (p) { setPais(p); ultimoPais = p; } }}
          countrySelectComponent={SelectorPais}
          labels={lang === "en" ? etiquetasEn : etiquetasEs}
          value={value || undefined}
          onChange={(v) => onChange(v ?? "")}
          placeholder={t("phone.placeholder")}
          autoComplete={autoComplete}
          autoFocus={autoFocus}
          aria-invalid={!!error}
          className="phone-input flex min-h-11 flex-1 items-stretch"
          numberInputProps={{ className: "input rounded-l-none border-l-0", "aria-label": t("phone.number") }}
        />
      </div>
      {error && <span className="mt-1 block text-xs text-red-600">{error}</span>}
    </div>
  );
}
