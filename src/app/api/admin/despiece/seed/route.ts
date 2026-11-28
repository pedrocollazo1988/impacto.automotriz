import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, textoPanel } from "@/lib/auth";
import { invalidarCacheDespiece } from "@/lib/despiece";
import { sembrarDespiece } from "@/lib/despiece-seed";

// Carga el despiece de fábrica en la base de datos de este entorno. Existe porque
// Preview y Producción usan bases distintas de la local, y sin esto no hay forma
// de sembrarlas desde el panel.
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "products");
  const r = await sembrarDespiece(prisma);
  invalidarCacheDespiece();
  await audit(u, "despiece.sembrar", await textoPanel(`${r.piezas} piezas, ${r.laminas} láminas`, `${r.piezas} parts, ${r.laminas} sheets`));
  return Response.json(r);
});
