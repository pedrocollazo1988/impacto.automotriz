-- Métodos de pago genéricos: cada fila elige un driver y puede añadirse desde
-- el panel sin una migración nueva.
ALTER TABLE "PaymentGateway" ADD COLUMN "provider" TEXT NOT NULL DEFAULT 'manual';
ALTER TABLE "PaymentGateway" ADD COLUMN "icon" TEXT NOT NULL DEFAULT 'card';
ALTER TABLE "PaymentGateway" ADD COLUMN "config" JSONB;
ALTER TABLE "PaymentGateway" ADD COLUMN "archived" BOOLEAN NOT NULL DEFAULT false;

-- El pedido guarda la clave del método y una copia del nombre visible.
ALTER TABLE "Order" ADD COLUMN "paymentMethodName" TEXT;
ALTER TABLE "Order" ALTER COLUMN "paymentMethod" TYPE TEXT USING "paymentMethod"::text;
DROP TYPE "PaymentMethod";

-- Relleno de los métodos que ya existían.
UPDATE "PaymentGateway" SET "provider" = 'tropipay', "icon" = 'card' WHERE "key" = 'TROPIPAY';
UPDATE "PaymentGateway" SET "provider" = 'qvapay', "icon" = 'bolt' WHERE "key" = 'QVAPAY';
UPDATE "PaymentGateway" SET "provider" = 'manual', "icon" = 'bank' WHERE "key" = 'TRANSFER';
UPDATE "PaymentGateway" SET "provider" = 'manual', "icon" = 'cash' WHERE "key" = 'CASH';
UPDATE "PaymentGateway" SET "config" = '{"requiereContraEntrega":"true"}'::jsonb WHERE "key" = 'CASH' AND "config" IS NULL;

UPDATE "Order" SET "paymentMethodName" = CASE "paymentMethod"
  WHEN 'TROPIPAY' THEN 'Tropipay'
  WHEN 'QVAPAY' THEN 'QvaPay'
  WHEN 'TRANSFER' THEN 'Transferencia bancaria'
  WHEN 'CASH' THEN 'Efectivo contra entrega'
  ELSE "paymentMethod"
END
WHERE "paymentMethodName" IS NULL;
