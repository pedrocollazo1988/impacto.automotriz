-- Medios de la ficha: vídeos, alternativa en vídeo al modelo 3D y giro 360.
-- Todo aditivo y con default, así que no toca las filas existentes.
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "videos" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "model3dVideo" TEXT;
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "spin360Frames" TEXT[] NOT NULL DEFAULT ARRAY[]::TEXT[];
ALTER TABLE "Product" ADD COLUMN IF NOT EXISTS "spin360Video" TEXT;
