import { z } from "zod";
import { errorHttp } from "@/lib/mensajes";
import { handle, HttpError } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { requireCustomer } from "@/lib/customer-auth";
import { verifyCustomerPin } from "@/lib/verify";
import { requireTurnstile } from "@/lib/turnstile";

const Body = z.object({ pin: z.string().regex(/^\d{6}$/, "El código debe tener 6 dígitos."), turnstileToken: z.string().max(2048).optional() });

export const POST = handle(async (req: Request) => {
  // Dos límites: por IP y por cuenta. Así rotar IP no reinicia los intentos.
  await limit(req, "pin-verify-ip", 12, 10 * 60_000);
  const me = await requireCustomer();
  await limitKey(me.id, "pin-verify", 6, 10 * 60_000);
  const { pin, turnstileToken } = Body.parse(await req.json());
  await requireTurnstile(req, turnstileToken);
  if (!(await verifyCustomerPin(me.id, pin))) throw await errorHttp(400, "pin.incorrecto");
  return Response.json({ ok: true });
});
