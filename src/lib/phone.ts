import { getCountries, parsePhoneNumberFromString, type CountryCode } from "libphonenumber-js";

/** País de la tienda cuando no hay mejor pista. */
export const PAIS_POR_DEFECTO: CountryCode = "CU";

/**
 * Devuelve el número en E.164 (+5355551234) o null si no es válido para el país.
 * Acepta tanto un número completo con prefijo como uno nacional + país.
 */
export function normalizarTelefono(valor: string | null | undefined, pais?: CountryCode): string | null {
  if (!valor?.trim()) return null;
  const numero = parsePhoneNumberFromString(valor.trim(), pais ?? PAIS_POR_DEFECTO);
  if (!numero || !numero.isValid()) return null;
  return numero.number;
}

export const esE164 = (v: string) => /^\+[1-9]\d{6,14}$/.test(v);

/** "es-CU" → CU. Si el idioma del navegador no trae región, se usa el de la tienda. */
export function paisDelNavegador(idioma?: string): CountryCode {
  const etiqueta = idioma ?? (typeof navigator === "undefined" ? "" : navigator.language);
  const region = /[-_]([A-Za-z]{2})$/.exec(etiqueta)?.[1]?.toUpperCase();
  return region && (getCountries() as string[]).includes(region) ? (region as CountryCode) : PAIS_POR_DEFECTO;
}

/** Texto legible para mostrar en el perfil: +53 5 555 1234. */
export function telefonoLegible(e164: string | null | undefined): string {
  if (!e164) return "";
  const p = parsePhoneNumberFromString(e164);
  return p ? p.formatInternational() : e164;
}
