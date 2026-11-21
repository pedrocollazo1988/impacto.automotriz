import { prisma } from "@/lib/prisma";
import { encrypt } from "@/lib/mailer";
import { CAMPOS, CLAVES, NOMBRES, type ClavePago, type Pasarela } from "@/lib/pasarelas";

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

// Valores por defecto. Las credenciales que ya estén en el entorno se importan
// la primera vez para no obligar a reescribirlas en el panel.
const SEMILLA: { key: ClavePago; kind: "online" | "manual"; enabled: boolean; orden: number; desc: string; env?: Record<string, string> }[] = [
  { key: "TROPIPAY", kind: "online", enabled: true, orden: 1, desc: "Tarjeta y saldo Tropipay. Confirmación automática.",
    env: { clientId: process.env.TROPIPAY_CLIENT_ID ?? "", clientSecret: process.env.TROPIPAY_CLIENT_SECRET ?? "", reasonId: process.env.TROPIPAY_REASON_ID ?? "4" } },
  { key: "QVAPAY", kind: "online", enabled: true, orden: 2, desc: "Pago con saldo QvaPay. Confirmación automática.",
    env: { appId: process.env.QVAPAY_APP_ID ?? "", appSecret: process.env.QVAPAY_APP_SECRET ?? "" } },
  { key: "TRANSFER", kind: "manual", enabled: true, orden: 3, desc: "Transferencia o depósito. Confirmamos el pago a mano." },
  { key: "CASH", kind: "manual", enabled: true, orden: 4, desc: "Pagas al recibir el pedido o al recogerlo en tienda." },
];

/** Crea las pasarelas que falten. Idempotente: se puede llamar en cada carga. */
export async function asegurarPasarelas() {
  const hay = await prisma.paymentGateway.count();
  if (hay >= SEMILLA.length) return;
  for (const s of SEMILLA) {
    const creds = s.env ? Object.fromEntries(Object.entries(s.env).filter(([, v]) => v)) : null;
    await prisma.paymentGateway.upsert({
      where: { key: s.key },
      update: {},
      create: {
        key: s.key, name: NOMBRES[s.key], description: s.desc, kind: s.kind, enabled: s.enabled, sortOrder: s.orden,
        instructions: s.key === "TRANSFER" ? (process.env.BANK_INSTRUCTIONS ?? "") : "",
        credsEnc: creds && Object.keys(creds).length ? cifrar(creds) : null,
      },
    });
  }
}

/** Todas las pasarelas, ya descifradas, listas para usar. */
export async function leerPasarelas(): Promise<(Pasarela & { creds: Record<string, string> | null })[]> {
  await asegurarPasarelas();
  const filas = await prisma.paymentGateway.findMany({ orderBy: { sortOrder: "asc" } });
  return filas.map((f) => ({
    key: f.key as ClavePago,
    name: f.name,
    description: f.description,
    kind: f.kind as "online" | "manual",
    enabled: f.enabled,
    sandbox: f.sandbox,
    sortOrder: f.sortOrder,
    instructions: f.instructions,
    feePercent: Number(f.feePercent),
    minTotalUsd: f.minTotalUsd == null ? null : Number(f.minTotalUsd),
    maxTotalUsd: f.maxTotalUsd == null ? null : Number(f.maxTotalUsd),
    creds: descifrar(f.credsEnc),
  }));
}

export const porClave = async (key: ClavePago) => (await leerPasarelas()).find((p) => p.key === key) ?? null;

// Solo las claves que declara cada pasarela; se ignora cualquier otra para no
// guardar basura ni secretos que no tocan.
export const limpiarCreds = (key: ClavePago, entrada: Record<string, unknown>) =>
  Object.fromEntries(CAMPOS[key].map((c) => [c.campo, String(entrada[c.campo] ?? "").trim()]).filter(([, v]) => v));

export { CLAVES };
