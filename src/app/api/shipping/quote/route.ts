import { z } from "zod";
import { handle } from "@/lib/auth";
import { quoteDelivery } from "@/lib/shipping";

// Vista previa para el selector del checkout. El costo FINAL se recalcula en el servidor
// con buildOrderDelivery() al crear el pedido.
const Body = z.object({ municipalityId: z.number().int(), subtotalUsd: z.number().min(0) });
export const POST = handle(async (req: Request) => {
  const b = Body.parse(await req.json());
  return Response.json(await quoteDelivery(b.municipalityId, b.subtotalUsd));
});
