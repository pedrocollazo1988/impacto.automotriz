import crypto from "node:crypto";
import { z } from "zod";
import { handle } from "@/lib/auth";
import { limit, limitKey } from "@/lib/ratelimit";
import { verifyCaptcha } from "@/lib/captcha";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SIN_CACHE = { "Cache-Control": "no-store" } as const;
const Cuerpo = z.object({
  token: z.string().min(1).max(4096),
  answer: z.string().min(1).max(32),
});

// Validación en tiempo real desde el cliente. Solo responde ok/no ok: nunca
// devuelve la respuesta ni pistas sobre ella. Los límites por IP y por reto
// impiden usar este endpoint como oráculo para adivinar el código.
export const POST = handle(async (req: Request) => {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400, headers: SIN_CACHE });
  }

  const body = Cuerpo.safeParse(json);
  if (!body.success) return Response.json({ ok: false }, { status: 400, headers: SIN_CACHE });

  await limit(req, "captcha-verify", 30, 60_000);
  await limitKey(crypto.createHash("sha256").update(body.data.token).digest("hex"), "captcha-token", 10, 600_000);

  try {
    return Response.json({ ok: verifyCaptcha(body.data.token, body.data.answer) }, { headers: SIN_CACHE });
  } catch (e) {
    console.error("captcha: no se pudo verificar el reto", e);
    return Response.json({ ok: false }, { status: 500, headers: SIN_CACHE });
  }
});
