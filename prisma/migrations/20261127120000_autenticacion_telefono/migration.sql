-- Autenticación por teléfono: la cuenta puede tener correo, teléfono o ambos.
ALTER TABLE "Customer"
  ADD COLUMN "avatarUrl" TEXT,
  ADD COLUMN "emailVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "phoneE164" TEXT,
  ADD COLUMN "phoneVerifiedAt" TIMESTAMP(3),
  ADD COLUMN "preferredLanguage" TEXT,
  ALTER COLUMN "email" DROP NOT NULL;

CREATE UNIQUE INDEX "Customer_phoneE164_key" ON "Customer"("phoneE164");

-- Códigos de un solo uso (SMS o correo), guardados solo como HMAC.
CREATE TABLE "OtpCode" (
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

  CONSTRAINT "OtpCode_pkey" PRIMARY KEY ("id")
);

CREATE INDEX "OtpCode_identifier_purpose_idx" ON "OtpCode"("identifier", "purpose");
CREATE INDEX "OtpCode_createdAt_idx" ON "OtpCode"("createdAt");

-- Sesiones de cliente con rotación de refresh token.
CREATE TABLE "AuthSession" (
  "id" TEXT NOT NULL,
  "customerId" TEXT NOT NULL,
  "refreshTokenHash" TEXT NOT NULL,
  "userAgent" TEXT,
  "ip" TEXT,
  "lastActivityAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  "revokedAt" TIMESTAMP(3),

  CONSTRAINT "AuthSession_pkey" PRIMARY KEY ("id")
);

CREATE UNIQUE INDEX "AuthSession_refreshTokenHash_key" ON "AuthSession"("refreshTokenHash");
CREATE INDEX "AuthSession_customerId_idx" ON "AuthSession"("customerId");

ALTER TABLE "OtpCode"
  ADD CONSTRAINT "OtpCode_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;

ALTER TABLE "AuthSession"
  ADD CONSTRAINT "AuthSession_customerId_fkey" FOREIGN KEY ("customerId") REFERENCES "Customer"("id") ON DELETE CASCADE ON UPDATE CASCADE;
