import { prisma } from "./prisma";

// El build de Vercel no aplica migraciones, así que la columna se crea en el
// primer uso, igual que la tabla MediaFile en storage.ts. Es aditiva y con
// default: no toca las filas existentes.
let columnaLista: Promise<void> | null = null;
export const asegurarVista = () => (columnaLista ??= (async () => {
  await prisma.$executeRawUnsafe(`ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "viewerMode" TEXT NOT NULL DEFAULT 'photos'`);
})().catch((e) => { columnaLista = null; throw e; }));
