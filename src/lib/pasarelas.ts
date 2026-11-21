// Reglas de las pasarelas de pago, sin base de datos ni red, para poder
// probarlas. La persistencia vive en src/lib/payment-gateways.ts.

export type ClavePago = "TROPIPAY" | "QVAPAY" | "TRANSFER" | "CASH";

export type Pasarela = {
  key: ClavePago;
  name: string;
  description: string;
  kind: "online" | "manual";
  enabled: boolean;
  sandbox: boolean;
  sortOrder: number;
  instructions: string;
  feePercent: number;
  minTotalUsd: number | null;
  maxTotalUsd: number | null;
};

// Lo que necesita cada pasarela para funcionar. Tropipay y QvaPay se llaman por
// API y necesitan credenciales; transferencia y efectivo son manuales.
export const CAMPOS: Record<ClavePago, { campo: string; etiqueta: string; secreto?: boolean; ayuda?: string }[]> = {
  TROPIPAY: [
    { campo: "clientId", etiqueta: "Client ID" },
    { campo: "clientSecret", etiqueta: "Client Secret", secreto: true },
    { campo: "reasonId", etiqueta: "Reason ID", ayuda: "Motivo del cobro que exige Tropipay (por defecto 4)." },
  ],
  QVAPAY: [
    { campo: "appId", etiqueta: "App ID" },
    { campo: "appSecret", etiqueta: "App Secret", secreto: true },
  ],
  TRANSFER: [
    { campo: "banco", etiqueta: "Banco" },
    { campo: "cuenta", etiqueta: "Número de cuenta" },
    { campo: "titular", etiqueta: "Titular" },
  ],
  CASH: [],
};

export const NOMBRES: Record<ClavePago, string> = {
  TROPIPAY: "Tropipay",
  QVAPAY: "QvaPay",
  TRANSFER: "Transferencia bancaria",
  CASH: "Efectivo contra entrega",
};

/** Una pasarela está operativa si está activa y tiene cubiertos sus campos obligatorios. */
export function estaOperativa(p: Pick<Pasarela, "key" | "enabled">, creds: Record<string, string> | null): boolean {
  if (!p.enabled) return false;
  return CAMPOS[p.key].every((c) => !c.secreto || (creds?.[c.campo] ?? "").trim() !== "");
}

/** Motivo legible de por qué una pasarela activa no aparece en el checkout. */
export function motivoNoDisponible(p: Pasarela, creds: Record<string, string> | null): string | null {
  if (!p.enabled) return "Desactivada en el panel";
  const faltan = CAMPOS[p.key].filter((c) => c.secreto && !(creds?.[c.campo] ?? "").trim());
  if (faltan.length) return `Falta ${faltan.map((c) => c.etiqueta).join(" y ")}`;
  return null;
}

/** Pasarelas que se le pueden ofrecer al comprador para un total dado, en orden. */
export function disponiblesPara(totalUsd: number, lista: Pasarela[], credsDe: (k: ClavePago) => Record<string, string> | null): Pasarela[] {
  return lista
    .filter((p) => estaOperativa(p, credsDe(p.key)))
    .filter((p) => p.minTotalUsd == null || totalUsd >= p.minTotalUsd)
    .filter((p) => p.maxTotalUsd == null || totalUsd <= p.maxTotalUsd)
    .sort((a, b) => a.sortOrder - b.sortOrder || a.name.localeCompare(b.name));
}

/** Comisión en USD, redondeada a centavos. */
export function comision(p: Pick<Pasarela, "feePercent">, totalUsd: number): number {
  if (!p.feePercent) return 0;
  return Math.round(totalUsd * (p.feePercent / 100) * 100) / 100;
}

/** Total que paga el comprador con la comisión aplicada. */
export function totalConComision(p: Pick<Pasarela, "feePercent">, totalUsd: number): number {
  return Math.round((totalUsd + comision(p, totalUsd)) * 100) / 100;
}

// Claves que admite el enum PaymentMethod de Prisma. Si algún día se añade una
// pasarela nueva hay que ampliar el enum; esto lo hace explícito.
export const CLAVES: ClavePago[] = ["TROPIPAY", "QVAPAY", "TRANSFER", "CASH"];
