// Carga el despiece interactivo. Ejecutar: npm run db:seed:despiece
import { PrismaClient } from "@prisma/client";
import { sembrarDespiece } from "../src/lib/despiece-seed";

const prisma = new PrismaClient();

sembrarDespiece(prisma)
  .then((r) => {
    console.log(`Despiece listo: ${r.piezas} piezas, ${r.laminas} láminas, vehículo ${r.vehiculo}.`);
    const { productos, pines, compatibilidades } = r.retirado;
    if (productos || pines || compatibilidades)
      console.log(`Retirado: ${productos} piezas, ${pines} pines, ${compatibilidades} compatibilidades.`);
  })
  .finally(() => prisma.$disconnect());
