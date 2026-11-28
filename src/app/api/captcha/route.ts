import { createCaptcha } from "@/lib/captcha";
import { mensaje } from "@/lib/mensajes";
import { getLang } from "@/lib/i18n";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const SIN_CACHE = { "Cache-Control": "no-store" } as const;

// Reto público: no requiere sesión. Devuelve el token firmado y el SVG, nunca
// la respuesta.
export async function GET() {
  try {
    const { token, svg } = createCaptcha(await getLang());
    return Response.json({ token, svg }, { headers: SIN_CACHE });
  } catch (e) {
    console.error("captcha: no se pudo crear el reto", e);
    return Response.json(
      { error: await mensaje("msg.captcha.noDisponible") },
      { status: 500, headers: SIN_CACHE },
    );
  }
}
