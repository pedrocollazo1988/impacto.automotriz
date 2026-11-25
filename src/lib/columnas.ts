// Cambios de esquema añadidos después de la migración inicial. El build de
// Vercel no aplica migraciones, así que no existen en una base ya desplegada y
// cualquier consulta revienta con P2022. Se aplican aquí, una vez por proceso.
// Son aditivos y con default: no tocan las filas existentes.
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
  // Métodos de pago genéricos: driver, icono, datos públicos y archivo.
  `ALTER TABLE "PaymentGateway" ADD COLUMN IF NOT EXISTS "provider" TEXT NOT NULL DEFAULT 'manual'`,
  `ALTER TABLE "PaymentGateway" ADD COLUMN IF NOT EXISTS "icon" TEXT NOT NULL DEFAULT 'card'`,
  `ALTER TABLE "PaymentGateway" ADD COLUMN IF NOT EXISTS "config" JSONB`,
  `ALTER TABLE "PaymentGateway" ADD COLUMN IF NOT EXISTS "archived" BOOLEAN NOT NULL DEFAULT false`,
  // El pedido guarda la clave del método y su nombre visible. Deja de ser un
  // enum para que el panel pueda crear métodos sin migración.
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "paymentMethodName" TEXT`,
  `ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'es'`,
  `ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'es'`,
  `ALTER TABLE "StockAlert" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'es'`,
  `ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE TEXT USING "paymentMethod"::text`,
  // Relleno de las filas que ya existían antes de este cambio.
  `UPDATE "PaymentGateway" SET "provider" = 'tropipay', "icon" = 'card' WHERE "key" = 'TROPIPAY' AND "provider" = 'manual'`,
  `UPDATE "PaymentGateway" SET "provider" = 'qvapay', "icon" = 'bolt' WHERE "key" = 'QVAPAY' AND "provider" = 'manual'`,
  `UPDATE "PaymentGateway" SET "icon" = 'bank' WHERE "key" = 'TRANSFER' AND "icon" = 'card'`,
  `UPDATE "PaymentGateway" SET "icon" = 'cash' WHERE "key" = 'CASH' AND "icon" = 'card'`,
  `UPDATE "PaymentGateway" SET "config" = '{"requiereContraEntrega":"true"}'::jsonb WHERE "key" = 'CASH' AND "config" IS NULL`,
  `UPDATE "Order" SET "paymentMethodName" = CASE "paymentMethod" WHEN 'TROPIPAY' THEN 'Tropipay' WHEN 'QVAPAY' THEN 'QvaPay' WHEN 'TRANSFER' THEN 'Transferencia bancaria' WHEN 'CASH' THEN 'Efectivo contra entrega' ELSE "paymentMethod" END WHERE "paymentMethodName" IS NULL`,
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
  `CREATE TABLE IF NOT EXISTS "ProductMovement" (
     "id" SERIAL NOT NULL,
     "productId" INTEGER NOT NULL,
     "variantId" INTEGER,
     "productName" TEXT NOT NULL,
     "sku" TEXT NOT NULL,
     "kind" TEXT NOT NULL DEFAULT 'AJUSTE',
     "delta" INTEGER NOT NULL DEFAULT 0,
     "stockBefore" INTEGER NOT NULL,
     "stockAfter" INTEGER NOT NULL,
     "detail" TEXT NOT NULL DEFAULT '',
     "orderId" TEXT,
     "orderNumber" INTEGER,
     "actor" TEXT NOT NULL DEFAULT '',
     "source" TEXT NOT NULL DEFAULT 'admin',
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "ProductMovement_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "ProductMovement_productId_createdAt_idx" ON "ProductMovement"("productId", "createdAt")`,
  `CREATE INDEX IF NOT EXISTS "ProductMovement_orderId_idx" ON "ProductMovement"("orderId")`,
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
    console.warn("[columnas] no se pudo asegurar el esquema:", e instanceof Error ? e.message : e);
  });
  hechos.set(cliente, hecho);
  return hecho;
}
