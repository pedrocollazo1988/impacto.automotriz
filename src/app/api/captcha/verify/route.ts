import { z } from "zod";
import { verifyCaptcha } from "@/lib/captcha";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SIN_CACHE = { "Cache-Control": "no-store" } as const;
const Cuerpo = z.object({
  token: z.string().min(1).max(4096),
  answer: z.string().min(1).max(32),
});

// Validación en tiempo real desde el cliente. Solo responde ok/no ok: nunca
// devuelve la respuesta ni pistas sobre ella.
export async function POST(req: Request) {
  let json: unknown;
  try {
    json = await req.json();
  } catch {
    return Response.json({ ok: false }, { status: 400, headers: SIN_CACHE });
  }

  const body = Cuerpo.safeParse(json);
  if (!body.success) return Response.json({ ok: false }, { status: 400, headers: SIN_CACHE });

  try {
    return Response.json({ ok: verifyCaptcha(body.data.token, body.data.answer) }, { headers: SIN_CACHE });
  } catch (e) {
    console.error("captcha: no se pudo verificar el reto", e);
    return Response.json({ ok: false }, { status: 500, headers: SIN_CACHE });
  }
}
