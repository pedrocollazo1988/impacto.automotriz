-- Campos para gestionar las categorías desde el panel. Aditivos y con valor por
-- defecto, así que las filas existentes siguen visibles y en su orden actual.
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "description" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "icon" TEXT NOT NULL DEFAULT '';
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "position" INTEGER NOT NULL DEFAULT 0;
ALTER TABLE "Category" ADD COLUMN IF NOT EXISTS "visible" BOOLEAN NOT NULL DEFAULT true;
CREATE INDEX IF NOT EXISTS "Category_position_idx" ON "Category"("position");
