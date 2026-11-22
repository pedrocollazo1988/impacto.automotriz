// Columnas añadidas después del esquema inicial. El build de Vercel no aplica
// migraciones, así que no existen en una base ya desplegada y cualquier consulta
// a Product revienta con P2022. Se crean aquí, una vez por proceso.
// Son aditivas y con default: no tocan las filas existentes.
const COLUMNAS = [
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "viewerMode" TEXT NOT NULL DEFAULT 'photos'`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "videos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "model3dVideo" TEXT`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "spin360Frames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[]`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "spin360Video" TEXT`,
  `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "icon" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0`,
  `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true`,
];

// Tablas nuevas. Se crean aquí por el mismo motivo: el despliegue no migra.
const TABLAS = [
  `CREATE TABLE IF NOT EXISTS "ContentBlock" (
     "id" SERIAL NOT NULL,
     "key" TEXT NOT NULL,
     "eyebrow" TEXT NOT NULL DEFAULT '',
     "title" TEXT NOT NULL DEFAULT '',
     "subtitle" TEXT NOT NULL DEFAULT '',
     "items" JSONB NOT NULL DEFAULT '[]',
     "visible" BOOLEAN NOT NULL DEFAULT true,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedBy" TEXT NOT NULL DEFAULT '',
     CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "ContentBlock_key_key" ON "ContentBlock"("key")`,
];

type Cliente = { $executeRawUnsafe(sql: string): Promise<unknown> };

// La caché va por cliente, no global: si fuera global, un cliente distinto (otra
// conexión, o el de un test) se quedaría sin el DDL.
const hechos = new WeakMap<Cliente, Promise<void>>();

// Best-effort: si la base no permite DDL se sigue igual, porque entonces las
// migraciones ya se aplicaron por otra vía.
export function aplicarColumnas(cliente: Cliente): Promise<void> {
  const previo = hechos.get(cliente);
  if (previo) return previo;
  const hecho = (async () => {
    for (const sql of [...COLUMNAS, ...TABLAS]) await cliente.$executeRawUnsafe(sql);
  })().catch((e) => {
    hechos.delete(cliente);
    console.warn("[columnas] no se pudieron asegurar las columnas de Product:", e instanceof Error ? e.message : e);
  });
  hechos.set(cliente, hecho);
  return hecho;
}
