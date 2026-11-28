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
  // Autenticación por teléfono: la cuenta puede tener correo, teléfono o ambos.
  `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "phoneE164" TEXT`,
  `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "phoneVerifiedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "emailVerifiedAt" TIMESTAMP(3)`,
  `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "avatarUrl" TEXT`,
  `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "preferredLanguage" TEXT`,
  `ALTER TABLE "Customer" ALTER COLUMN "email" DROP NOT NULL`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Customer_phoneE164_key" ON "Customer"("phoneE164")`,
  // Entrada con Telegram (gratis y sin restricción para Cuba).
  `ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "telegramId" TEXT`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "Customer_telegramId_key" ON "Customer"("telegramId")`,
  // Tema del panel guardado por usuario del equipo.
  `ALTER TABLE "StaffUser" ADD COLUMN IF NOT EXISTS "theme" TEXT`,
];

// Tablas nuevas. Se crean aquí por el mismo motivo: el despliegue no migra.
const TABLAS = [
  `CREATE TABLE IF NOT EXISTS "Address" (
     "id" SERIAL NOT NULL,
     "customerId" TEXT NOT NULL,
     "label" TEXT NOT NULL DEFAULT 'Casa',
     "recipientName" TEXT NOT NULL,
     "recipientPhone" TEXT NOT NULL,
     "provinceId" INTEGER NOT NULL,
     "provinceName" TEXT NOT NULL,
     "municipalityId" INTEGER NOT NULL,
     "municipalityName" TEXT NOT NULL,
     "address" TEXT NOT NULL,
     "reference" TEXT,
     "isDefault" BOOLEAN NOT NULL DEFAULT false,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "Address_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE INDEX IF NOT EXISTS "Address_customerId_idx" ON "Address"("customerId")`,
  `CREATE TABLE IF NOT EXISTS "ContentBlock" (
     "id" SERIAL NOT NULL,
     "key" TEXT NOT NULL,
     "lang" TEXT NOT NULL DEFAULT 'es',
     "eyebrow" TEXT NOT NULL DEFAULT '',
     "title" TEXT NOT NULL DEFAULT '',
     "subtitle" TEXT NOT NULL DEFAULT '',
     "items" JSONB NOT NULL DEFAULT '[]',
     "visible" BOOLEAN NOT NULL DEFAULT true,
     "updatedAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "updatedBy" TEXT NOT NULL DEFAULT '',
     CONSTRAINT "ContentBlock_pkey" PRIMARY KEY ("id")
   )`,
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
  // Códigos de un solo uso (SMS o correo), guardados solo como HMAC.
  `CREATE TABLE IF NOT EXISTS "OtpCode" (
     "id" TEXT NOT NULL,
     "identifier" TEXT NOT NULL,
     "channel" TEXT NOT NULL,
     "purpose" TEXT NOT NULL,
     "codeHash" TEXT NOT NULL,
     "expiresAt" TIMESTAMP(3) NOT NULL,
     "attempts" INTEGER NOT NULL DEFAULT 0,
     "consumedAt" TIMESTAMP(3),
     "customerId" TEXT,
     "ip" TEXT,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id"),
     CONSTRAINT "OtpCode_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
   )`,
  `CREATE INDEX IF NOT EXISTS "OtpCode_identifier_purpose_idx" ON "OtpCode"("identifier", "purpose")`,
  `CREATE INDEX IF NOT EXISTS "OtpCode_createdAt_idx" ON "OtpCode"("createdAt")`,
  // Sesiones de cliente con rotación de refresh token.
  `CREATE TABLE IF NOT EXISTS "AuthSession" (
     "id" TEXT NOT NULL,
     "customerId" TEXT NOT NULL,
     "refreshTokenHash" TEXT NOT NULL,
     "userAgent" TEXT,
     "ip" TEXT,
     "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "revokedAt" TIMESTAMP(3),
     CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id"),
     CONSTRAINT "AuthSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "AuthSession_refreshTokenHash_key" ON "AuthSession"("refreshTokenHash")`,
  `CREATE INDEX IF NOT EXISTS "AuthSession_customerId_idx" ON "AuthSession"("customerId")`,
  // Entrada por enlace de Telegram (el bot confirma el nonce desde el móvil).
  `CREATE TABLE IF NOT EXISTS "TelegramLogin" (
     "id" SERIAL NOT NULL,
     "nonce" TEXT NOT NULL,
     "estado" TEXT NOT NULL DEFAULT 'pendiente',
     "telegramId" TEXT,
     "chatId" TEXT,
     "nombre" TEXT NOT NULL DEFAULT '',
     "usuario" TEXT,
     "foto" TEXT,
     "creadoEn" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
     "confirmadoEn" TIMESTAMP(3),
     "usadoEn" TIMESTAMP(3),
     CONSTRAINT "TelegramLogin_pkey" PRIMARY KEY ("id")
   )`,
  `CREATE UNIQUE INDEX IF NOT EXISTS "TelegramLogin_nonce_key" ON "TelegramLogin"("nonce")`,
];

// Ajustes que van al final, después de TABLAS: la tabla tiene que existir antes
// de tocar sus columnas o índices.
const AJUSTES = [
  // El contenido editable pasa a existir por idioma: una fila en español y otra
  // en inglés para la misma sección.
  `ALTER TABLE "ContentBlock" ADD COLUMN IF NOT EXISTS "lang" TEXT NOT NULL DEFAULT 'es'`,
  // La clave de las secciones deja de ser única por sí sola: ahora lo es junto al
  // idioma, para que la misma sección exista en español y en inglés. El índice
  // conserva su nombre original para actualizar en sitio una base ya desplegada,
  // donde era único solo por «key»; si ya cubre las dos columnas, no se toca.
  `DO $$
   BEGIN
     ALTER TABLE "ContentBlock" DROP CONSTRAINT IF EXISTS "ContentBlock_key_key";
     IF EXISTS (
       SELECT 1
       FROM pg_index i
       JOIN pg_class idx ON idx.oid = i.indexrelid
       JOIN pg_class tbl ON tbl.oid = i.indrelid
       WHERE idx.relname = 'ContentBlock_key_key' AND tbl.relname = 'ContentBlock' AND i.indnatts = 1
     ) THEN
       EXECUTE 'DROP INDEX "ContentBlock_key_key"';
     END IF;
     EXECUTE 'CREATE UNIQUE INDEX IF NOT EXISTS "ContentBlock_key_key" ON "ContentBlock"("key", "lang")';
   END $$`,
  // Textos en inglés de lo que escribe el negocio (categorías, productos,
  // marcas, entregas y pagos). Van al final para no alterar el orden de las
  // columnas existentes en una base ya desplegada.
  `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "nameEn" TEXT`,
  `ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "nameEn" TEXT`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT`,
  `ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "specsEn" JSONB`,
  `ALTER TABLE "Brand" ADD COLUMN IF NOT EXISTS "nameEn" TEXT`,
  `ALTER TABLE "DeliveryMethod" ADD COLUMN IF NOT EXISTS "nameEn" TEXT`,
  `ALTER TABLE "DeliveryMethod" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT`,
  `ALTER TABLE "PaymentGateway" ADD COLUMN IF NOT EXISTS "nameEn" TEXT`,
  `ALTER TABLE "PaymentGateway" ADD COLUMN IF NOT EXISTS "descriptionEn" TEXT NOT NULL DEFAULT ''`,
  `ALTER TABLE "PaymentGateway" ADD COLUMN IF NOT EXISTS "instructionsEn" TEXT NOT NULL DEFAULT ''`,
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
    for (const sql of [...COLUMNAS, ...TABLAS, ...AJUSTES]) await cliente.$executeRawUnsafe(sql);
  })().catch((e) => {
    hechos.delete(cliente);
    console.warn("[columnas] no se pudo asegurar el esquema:", e instanceof Error ? e.message : e);
  });
  hechos.set(cliente, hecho);
  return hecho;
}
