-- Entrada con Telegram: identidad del cliente en ese servicio.
ALTER TABLE "Customer" ADD COLUMN IF NOT EXISTS "telegramId" TEXT;
CREATE UNIQUE INDEX IF NOT EXISTS "Customer_telegramId_key" ON "Customer"("telegramId");
