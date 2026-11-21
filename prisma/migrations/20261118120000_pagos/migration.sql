-- Pasarelas de pago configurables desde el panel.
CREATE TABLE "PaymentGateway" (
    "id" SERIAL NOT NULL,
    "key" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "description" TEXT NOT NULL DEFAULT '',
    "kind" TEXT NOT NULL DEFAULT 'online',
    "enabled" BOOLEAN NOT NULL DEFAULT false,
    "sandbox" BOOLEAN NOT NULL DEFAULT true,
    "sortOrder" INTEGER NOT NULL DEFAULT 0,
    "instructions" TEXT NOT NULL DEFAULT '',
    "credsEnc" TEXT,
    "feePercent" DECIMAL(5,2) NOT NULL DEFAULT 0,
    "minTotalUsd" DECIMAL(10,2),
    "maxTotalUsd" DECIMAL(10,2),
    "updatedAt" TIMESTAMP(3) NOT NULL,
    CONSTRAINT "PaymentGateway_pkey" PRIMARY KEY ("id")
);
CREATE UNIQUE INDEX "PaymentGateway_key_key" ON "PaymentGateway"("key");

-- Comisión de la pasarela en el pedido, para que el total cuadre con el desglose.
ALTER TABLE "Order" ADD COLUMN "paymentFeeUsd" DECIMAL(10,2) NOT NULL DEFAULT 0;
