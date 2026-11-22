-- Vista inicial de la ficha (fotos / 3D / 360). Aditivo y con default, así que
-- no rompe las filas existentes ni requiere relleno.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "viewerMode" TEXT NOT NULL DEFAULT 'photos';
