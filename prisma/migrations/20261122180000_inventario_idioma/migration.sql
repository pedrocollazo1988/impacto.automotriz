-- Idioma de los correos y historial de inventario.
ALTER TABLE "Order" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'es';
ALTER TABLE "Subscriber" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'es';
ALTER TABLE "StockAlert" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'es';

CREATE TABLE IF NOT EXISTS "ProductMovement" (
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
  CONSTRAINT "ProductMovement_pkey" PRIMARY KEY ("id"),
  CONSTRAINT "ProductMovement_productId_fkey" FOREIGN KEY ("productId") REFERENCES "Product"("id") ON DELETE CASCADE ON UPDATE CASCADE
);

CREATE INDEX IF NOT EXISTS "ProductMovement_productId_createdAt_idx" ON "ProductMovement"("productId", "createdAt");
CREATE INDEX IF NOT EXISTS "ProductMovement_orderId_idx" ON "ProductMovement"("orderId");
