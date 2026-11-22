import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/mailer";
import { DRIVERS, driverDe, esDriverId, limpiarCampos, type DriverId, type Pasarela } from "@/lib/pasarelas";

// Las credenciales se guardan cifradas con AES-256-GCM (la misma clave que el
// SMTP: APP_SECRET). `decrypt` es privado del mailer, así que se reexporta aquí
// solo para leer credenciales dentro del servidor.
import crypto from "node:crypto";

const clave = () => crypto.createHash("sha256").update(process.env.APP_SECRET ?? "").digest();

export function descifrar(s: string | null): Record<string, string> | null {
  if (!s || !process.env.APP_SECRET) return null;
  try {
    const [iv, tag, enc] = s.split(".").map((x) => Buffer.from(x, "base64"));
    const d = crypto.createDecipheriv("aes-256-gcm", clave(), iv);
    d.setAuthTag(tag);
    return JSON.parse(Buffer.concat([d.update(enc), d.final()]).toString("utf8"));
  } catch {
    return null; // APP_SECRET cambió o el dato está corrupto: se trata como "sin credenciales"
  }
}

export const cifrar = (creds: Record<string, string>) => encrypt(JSON.stringify(creds));

export type PasarelaConCreds = Pasarela & { id: number; creds: Record<string, string> | null };

const texto = (v: unknown) => String(v ?? "").trim();

function configDe(valor: unknown): Record<string, string> | null {
  if (!valor || typeof valor !== "object" || Array.isArray(valor)) return null;
  const salida: Record<string, string> = {};
  for (const [k, v] of Object.entries(valor as Record<string, unknown>)) salida[k] = texto(v);
  return Object.keys(salida).length ? salida : null;
}

function normalizar(f: {
  id: number; key: string; provider: string; name: string; description: string; kind: string; icon: string;
  enabled: boolean; archived: boolean; sandbox: boolean; sortOrder: number; instructions: string;
  feePercent: unknown; minTotalUsd: unknown; maxTotalUsd: unknown; config: unknown; credsEnc: string | null;
}): PasarelaConCreds {
  const provider: DriverId = esDriverId(f.provider) ? f.provider : "manual";
  const driver = DRIVERS[provider];
  return {
    id: f.id,
    key: f.key,
    provider,
    name: f.name,
    description: f.description,
    kind: driver.kind,
    icon: f.icon || driver.icono,
    enabled: f.enabled,
    archived: f.archived,
    sandbox: f.sandbox,
    sortOrder: f.sortOrder,
    instructions: f.instructions,
    feePercent: Number(f.feePercent),
    minTotalUsd: f.minTotalUsd == null ? null : Number(f.minTotalUsd),
    maxTotalUsd: f.maxTotalUsd == null ? null : Number(f.maxTotalUsd),
    config: configDe(f.config),
    creds: descifrar(f.credsEnc),
  };
}

type Semilla = {
  key: string;
  provider: DriverId;
  name: string;
  description: string;
  icon: string;
  enabled: boolean;
  orden: number;
  instructions?: string;
  config?: Record<string, string>;
  env?: Record<string, string>;
};

// Valores por defecto. Las credenciales que ya estén en el entorno se importan
// la primera vez para no obligar a reescribirlas en el panel.
const SEMILLA: Semilla[] = [
  {
    key: "TROPIPAY", provider: "tropipay", name: "Tropipay", icon: "card", enabled: true, orden: 1,
    description: "Tarjeta y saldo Tropipay. Confirmación automática.",
    env: { clientId: process.env.TROPIPAY_CLIENT_ID ?? "", clientSecret: process.env.TROPIPAY_CLIENT_SECRET ?? "", reasonId: process.env.TROPIPAY_REASON_ID ?? "4" },
  },
  {
    key: "QVAPAY", provider: "qvapay", name: "QvaPay", icon: "bolt", enabled: true, orden: 2,
    description: "Pago con saldo QvaPay. Confirmación automática.",
    env: { appId: process.env.QVAPAY_APP_ID ?? "", appSecret: process.env.QVAPAY_APP_SECRET ?? "" },
  },
  {
    key: "TRANSFER", provider: "manual", name: "Transferencia bancaria", icon: "bank", enabled: true, orden: 3,
    description: "Transferencia o depósito. Confirmamos el pago a mano.",
    instructions: process.env.BANK_INSTRUCTIONS ?? "",
  },
  {
    key: "CASH", provider: "manual", name: "Efectivo contra entrega", icon: "cash", enabled: true, orden: 4,
    description: "Pagas al recibir el pedido o al recogerlo en tienda.",
    config: { requiereContraEntrega: "true" },
  },
];

/** Crea los métodos que falten. Idempotente: se puede llamar en cada carga. */
export async function asegurarPasarelas() {
  const hay = await prisma.paymentGateway.count();
  if (hay > 0) return;
  for (const s of SEMILLA) {
    const driver = DRIVERS[s.provider];
    const { publicos, secretos } = limpiarCampos(s.provider, s.env ?? {});
    const config = s.config ?? (Object.keys(publicos).length ? publicos : undefined);
    await prisma.paymentGateway.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key,
        provider: s.provider,
        name: s.name,
        description: s.description,
        kind: driver.kind,
        icon: s.icon,
        enabled: s.enabled,
        sortOrder: s.orden,
        instructions: s.instructions ?? "",
        config,
        credsEnc: Object.keys(secretos).length ? cifrar(secretos) : null,
      },
    });
  }
}

/** Todos los métodos, ya descifrados y normalizados. */
export async function leerPasarelas(opciones: { incluirArchivadas?: boolean } = {}): Promise<PasarelaConCreds[]> {
  await asegurarPasarelas();
  const filas = await prisma.paymentGateway.findMany({
    where: opciones.incluirArchivadas ? {} : { archived: false },
    orderBy: [{ sortOrder: "asc" }, { name: "asc" }],
  });
  return filas.map(normalizar);
}

/** Busca un método por su clave. Incluye archivados para poder mostrar pedidos antiguos. */
export async function porClave(key: string): Promise<PasarelaConCreds | null> {
  const fila = await prisma.paymentGateway.findUnique({ where: { key } });
  return fila ? normalizar(fila) : null;
}

/** Solo las claves que declara el driver; se ignora cualquier otra. */
export const limpiarCreds = (provider: DriverId, entrada: Record<string, unknown>) =>
  limpiarCampos(provider, entrada).secretos;

/** Solo los datos públicos que declara el driver. */
export const limpiarConfig = (provider: DriverId, entrada: Record<string, unknown>) =>
  limpiarCampos(provider, entrada).publicos;

/** Comprueba que el driver existe antes de aceptar un cambio de proveedor. */
export const driverValido = (provider: string): provider is DriverId => esDriverId(provider);

/** Metadatos que necesita el panel para dibujar el formulario de cada driver. */
export const driversDelPanel = () => Object.values(DRIVERS).map((d) => ({
  id: d.id, nombre: d.nombre, descripcion: d.descripcion, kind: d.kind, icono: d.icono, campos: d.campos,
}));
