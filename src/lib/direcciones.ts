import { normalizarTelefono } from "./phone";

/** Campos que el usuario rellena en la libreta de direcciones. */
export type EntradaDireccion = {
  label: string;
  recipientName: string;
  recipientPhone: string;
  provinceId: number | null;
  provinceName: string;
  municipalityId: number | null;
  municipalityName: string;
  address: string;
  reference: string;
};

export type CampoDireccion = keyof EntradaDireccion;
export type ErroresDireccion = Partial<Record<CampoDireccion | "general", string>>;

export const MAX_DIRECCIONES = 20;
export const ETIQUETA_POR_DEFECTO = "Casa";

const espacios = (v: unknown) => String(v ?? "").replace(/\s+/g, " ").trim();

/** Deja los campos como los guarda la base: recortados y con un solo espacio. */
export function normalizarDireccion(e: Partial<EntradaDireccion>): EntradaDireccion {
  return {
    label: espacios(e.label) || ETIQUETA_POR_DEFECTO,
    recipientName: espacios(e.recipientName),
    recipientPhone: espacios(e.recipientPhone),
    provinceId: Number.isInteger(e.provinceId) ? (e.provinceId as number) : null,
    provinceName: espacios(e.provinceName),
    municipalityId: Number.isInteger(e.municipalityId) ? (e.municipalityId as number) : null,
    municipalityName: espacios(e.municipalityName),
    address: espacios(e.address),
    reference: espacios(e.reference),
  };
}

/** Errores por campo; vacío significa que se puede guardar. */
export function validarDireccion(e: EntradaDireccion): ErroresDireccion {
  const errores: ErroresDireccion = {};
  if (e.label.length > 24) errores.label = "dir.errLabel";
  if (e.recipientName.length < 3) errores.recipientName = "dir.errName";
  if (e.recipientName.length > 80) errores.recipientName = "dir.errName";
  if (!normalizarTelefono(e.recipientPhone)) errores.recipientPhone = "dir.errPhone";
  if (!e.provinceId || e.provinceId <= 0) errores.provinceId = "dir.errProvince";
  if (!e.municipalityId || e.municipalityId <= 0) errores.municipalityId = "dir.errMunicipality";
  if (e.address.length < 8) errores.address = "dir.errAddress";
  if (e.address.length > 160) errores.address = "dir.errAddress";
  if (e.reference.length > 120) errores.reference = "dir.errReference";
  return errores;
}

export const direccionValida = (e: EntradaDireccion) => Object.keys(validarDireccion(e)).length === 0;

/** La principal primero; el resto, de la más nueva a la más vieja. */
export function ordenarDirecciones<T extends { isDefault: boolean; updatedAt: Date }>(lista: T[]): T[] {
  return [...lista].sort((a, b) => {
    if (a.isDefault !== b.isDefault) return a.isDefault ? -1 : 1;
    return b.updatedAt.getTime() - a.updatedAt.getTime();
  });
}

/**
 * Qué dirección debe quedar como principal al borrar una: si la borrada no era
 * la principal, se queda la que había; si lo era, pasa a serlo la más reciente
 * de las que siguen. Devuelve null cuando no queda ninguna.
 */
export function principalTrasBorrar<T extends { id: number; isDefault: boolean; updatedAt: Date }>(
  lista: T[],
  borradaId: number,
): number | null {
  const quedan = lista.filter((d) => d.id !== borradaId);
  if (!quedan.length) return null;
  const actual = quedan.find((d) => d.isDefault);
  if (actual) return actual.id;
  return ordenarDirecciones(quedan)[0].id;
}

/** Texto de una línea para listas y resúmenes. */
export function textoDireccion(d: { address: string; reference?: string | null; municipalityName: string; provinceName: string }): string {
  return [d.address, d.reference, d.municipalityName, d.provinceName].filter(Boolean).join(", ");
}

/** Forma que acepta la base: la geografía ya validada, sin nulos. */
export type DireccionGuardable = {
  label: string; recipientName: string; recipientPhone: string;
  provinceId: number; provinceName: string;
  municipalityId: number; municipalityName: string;
  address: string; reference: string | null;
};

export function aGuardar(e: EntradaDireccion): DireccionGuardable | null {
  if (!direccionValida(e) || e.provinceId === null || e.municipalityId === null) return null;
  return {
    label: e.label, recipientName: e.recipientName, recipientPhone: e.recipientPhone,
    provinceId: e.provinceId, provinceName: e.provinceName,
    municipalityId: e.municipalityId, municipalityName: e.municipalityName,
    address: e.address, reference: e.reference || null,
  };
}
