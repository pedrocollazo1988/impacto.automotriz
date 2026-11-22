// Reglas de los métodos de pago, sin base de datos ni red, para poder probarlas.
// La persistencia vive en src/lib/payment-gateways.ts.
//
// Un método de pago es una fila de PaymentGateway. `provider` elige el
// comportamiento (cobro automático, manual o enlace externo) y los campos que
// se configuran. Así se pueden añadir métodos nuevos desde el panel sin tocar
// el esquema ni el código del checkout.

export type DriverId = "tropipay" | "qvapay" | "manual" | "link";

export type CampoPago = {
  campo: string;
  etiqueta: string;
  tipo?: "text" | "password" | "url" | "textarea" | "number" | "checkbox";
  secreto?: boolean;
  obligatorio?: boolean;
  /** Los campos internos (por ejemplo, una regla) no se enseñan al comprador. */
  publico?: boolean;
  ayuda?: string;
  porDefecto?: string;
};

export type Driver = {
  id: DriverId;
  nombre: string;
  descripcion: string;
  kind: "online" | "manual";
  icono: string;
  campos: CampoPago[];
  /** El servidor crea el cobro en la pasarela y devuelve un enlace. */
  cobroEnLinea?: boolean;
  /** Al confirmar el pedido se redirige al comprador a `config.url`. */
  redirige?: boolean;
};

const CAMPOS_TROPIPAY: CampoPago[] = [
  { campo: "clientId", etiqueta: "Client ID", obligatorio: true },
  { campo: "clientSecret", etiqueta: "Client Secret", tipo: "password", secreto: true, obligatorio: true },
  { campo: "reasonId", etiqueta: "Reason ID", ayuda: "Motivo del cobro que exige Tropipay (por defecto 4).", porDefecto: "4" },
];

const CAMPOS_QVAPAY: CampoPago[] = [
  { campo: "appId", etiqueta: "App ID", obligatorio: true },
  { campo: "appSecret", etiqueta: "App Secret", tipo: "password", secreto: true, obligatorio: true },
];

const CAMPOS_MANUAL: CampoPago[] = [
  { campo: "banco", etiqueta: "Banco", ayuda: "Opcional: también puedes escribir los datos en las instrucciones." },
  { campo: "cuenta", etiqueta: "Número de cuenta" },
  { campo: "titular", etiqueta: "Titular" },
  { campo: "referencia", etiqueta: "Dato que debe poner el comprador", ayuda: "Por ejemplo, el número de pedido o el correo." },
  { campo: "requiereContraEntrega", etiqueta: "Solo con pago contra entrega", tipo: "checkbox", publico: false, ayuda: "Si la entrega elegida no admite pago contra entrega, este método no se ofrece." },
];

const CAMPOS_LINK: CampoPago[] = [
  { campo: "url", etiqueta: "URL de pago", tipo: "url", obligatorio: true, ayuda: "Enlace de PayPal, Stripe, Zelle u otra pasarela externa." },
  { campo: "referencia", etiqueta: "Texto del botón", ayuda: "Por defecto: «Ir a pagar»." },
];

export const DRIVERS: Record<DriverId, Driver> = {
  tropipay: {
    id: "tropipay",
    nombre: "Tropipay",
    descripcion: "Tarjeta y saldo Tropipay. Confirmación automática.",
    kind: "online",
    icono: "card",
    campos: CAMPOS_TROPIPAY,
    cobroEnLinea: true,
  },
  qvapay: {
    id: "qvapay",
    nombre: "QvaPay",
    descripcion: "Pago con saldo QvaPay. Confirmación automática.",
    kind: "online",
    icono: "bolt",
    campos: CAMPOS_QVAPAY,
    cobroEnLinea: true,
  },
  manual: {
    id: "manual",
    nombre: "Pago manual",
    descripcion: "Transferencia, depósito, Zelle, USDT o efectivo. Tú confirmas el pago.",
    kind: "manual",
    icono: "bank",
    campos: CAMPOS_MANUAL,
  },
  link: {
    id: "link",
    nombre: "Enlace de pago",
    descripcion: "Redirige a un enlace externo (PayPal, Stripe, etc.) y tú confirmas el pago.",
    kind: "manual",
    icono: "link",
    campos: CAMPOS_LINK,
    redirige: true,
  },
};

export const DRIVER_IDS = Object.keys(DRIVERS) as DriverId[];

export function esDriverId(v: unknown): v is DriverId {
  return typeof v === "string" && v in DRIVERS;
}

export function driverDe(p: Pick<Pasarela, "provider"> | DriverId): Driver {
  const id = typeof p === "string" ? p : p.provider;
  return DRIVERS[esDriverId(id) ? id : "manual"];
}

/** Plantillas que el panel ofrece al crear un método. */
export type Preset = {
  id: string;
  nombre: string;
  provider: DriverId;
  icono: string;
  descripcion: string;
  config?: Record<string, string>;
};

export const PRESETS: Preset[] = [
  { id: "transferencia", nombre: "Transferencia bancaria", provider: "manual", icono: "bank", descripcion: "Datos bancarios y confirmación manual." },
  { id: "zelle", nombre: "Zelle", provider: "manual", icono: "send", descripcion: "Transferencia entre personas en Estados Unidos." },
  { id: "usdt", nombre: "USDT / cripto", provider: "manual", icono: "crypto", descripcion: "Red o monedero que indiques en las instrucciones." },
  { id: "efectivo", nombre: "Efectivo contra entrega", provider: "manual", icono: "cash", descripcion: "Solo para entregas que admitan pago contra entrega.", config: { requiereContraEntrega: "true" } },
  { id: "enlace", nombre: "Enlace de pago", provider: "link", icono: "link", descripcion: "PayPal, Stripe u otra pasarela con enlace propio." },
  { id: "tropipay", nombre: "Tropipay", provider: "tropipay", icono: "card", descripcion: "Cobro automático con Tropipay." },
  { id: "qvapay", nombre: "QvaPay", provider: "qvapay", icono: "bolt", descripcion: "Cobro automático con QvaPay." },
];

export type Pasarela = {
  key: string;
  provider: DriverId;
  name: string;
  description: string;
  kind: "online" | "manual";
  icon: string;
  enabled: boolean;
  archived: boolean;
  sandbox: boolean;
  sortOrder: number;
  instructions: string;
  feePercent: number;
  minTotalUsd: number | null;
  maxTotalUsd: number | null;
  /** Datos públicos del método (banco, cuenta, URL…). Nunca secretos. */
  config: Record<string, string> | null;
};

const texto = (v: unknown) => String(v ?? "").trim();

/** Campos públicos que el comprador puede ver (banco, cuenta, titular…). */
export function datosPublicos(p: Pick<Pasarela, "provider" | "config">): { etiqueta: string; valor: string }[] {
  const driver = driverDe(p);
  return driver.campos
    .filter((c) => c.publico !== false && !c.secreto)
    .map((c) => ({ etiqueta: c.etiqueta, valor: texto(p.config?.[c.campo]) }))
    .filter((x) => x.valor !== "");
}

/** Campos obligatorios que faltan, para avisar en el panel y no ofrecer el método. */
export function camposPendientes(p: Pick<Pasarela, "provider" | "config">, creds: Record<string, string> | null): CampoPago[] {
  const driver = driverDe(p);
  return driver.campos.filter((c) => {
    if (!c.obligatorio) return false;
    // Compatibilidad: las filas antiguas guardaban también los campos públicos
    // dentro de las credenciales cifradas.
    const valor = c.secreto ? creds?.[c.campo] : (p.config?.[c.campo] ?? creds?.[c.campo]);
    return texto(valor) === "";
  });
}

/** Un método está operativo si está activo, no archivado y tiene lo obligatorio. */
export function estaOperativa(p: Pick<Pasarela, "provider" | "enabled" | "archived" | "config">, creds: Record<string, string> | null): boolean {
  if (!p.enabled || p.archived) return false;
  return camposPendientes(p, creds).length === 0;
}

/** Motivo legible de por qué un método activo no aparece en el checkout. */
export function motivoNoDisponible(p: Pasarela, creds: Record<string, string> | null): string | null {
  if (p.archived) return "Archivado";
  if (!p.enabled) return "Desactivado en el panel";
  const faltan = camposPendientes(p, creds);
  if (faltan.length) return `Falta ${faltan.map((c) => c.etiqueta).join(" y ")}`;
  return null;
}

/** Métodos que se le pueden ofrecer al comprador para un total dado, en orden. */
export function disponiblesPara(totalUsd: number, lista: Pasarela[], credsDe: (k: string) => Record<string, string> | null): Pasarela[] {
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

export function esCobroAutomatico(p: Pick<Pasarela, "provider">): boolean {
  return driverDe(p).cobroEnLinea === true;
}

export function redirigeAlPagar(p: Pick<Pasarela, "provider">): boolean {
  return driverDe(p).redirige === true;
}

export function requiereContraEntrega(p: Pick<Pasarela, "key" | "provider" | "config">): boolean {
  return p.config?.requiereContraEntrega === "true" || p.key === "CASH";
}

const SLUG = /^[A-Za-z0-9][A-Za-z0-9_-]{1,39}$/;

export function claveValida(key: string): boolean {
  return SLUG.test(key);
}

export function slugify(nombre: string): string {
  return nombre
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40) || "pago";
}

/** Normaliza los valores del formulario para el driver elegido. */
export function limpiarCampos(provider: DriverId, entrada: Record<string, unknown> | null | undefined) {
  const driver = DRIVERS[provider];
  const publicos: Record<string, string> = {};
  const secretos: Record<string, string> = {};
  for (const c of driver.campos) {
    const presente = !!entrada && Object.prototype.hasOwnProperty.call(entrada, c.campo);
    const raw = entrada?.[c.campo];
    const valor = c.tipo === "checkbox" ? (raw === true || raw === "true" ? "true" : "false") : texto(raw);
    if (c.secreto) {
      if (valor) secretos[c.campo] = valor;
    } else if (presente || valor !== "" || c.tipo === "checkbox") {
      publicos[c.campo] = valor;
    }
  }
  return { publicos, secretos };
}

/** Valores por defecto de un driver, útiles al crear un método desde una plantilla. */
export function valoresPorDefecto(provider: DriverId): Record<string, string> {
  return Object.fromEntries(
    DRIVERS[provider].campos.filter((c) => c.porDefecto !== undefined).map((c) => [c.campo, c.porDefecto as string]),
  );
}
