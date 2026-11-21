-- El visor 3D se retiró: la ficha del producto usa fotos reales y el giro 360
-- solo aparece cuando hay una secuencia de fotos. Los .glb apuntados ya no
-- existen en el repositorio.
ALTER TABLE "Product" DROP COLUMN "model3dUrl";
