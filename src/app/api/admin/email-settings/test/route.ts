import { z } from "zod";
import { handle, requireAdmin, errorPanel } from "@/lib/auth";
import { getLang } from "@/lib/i18n";
import { sendTest } from "@/lib/mailer";

export const POST = handle(async (req: Request) => {
  await requireAdmin(req, "email");
  const { to } = z.object({ to: z.string().email() }).parse(await req.json());
  const lang = await getLang();
  const txt = (es: string, en: string) => (lang === "en" ? en : es);
  try {
    await sendTest(
      to,
      txt("Prueba de configuración", "Configuration test"),
      txt(
        "<p>Si recibes este correo, el envío de autenticación y códigos de verificación ya funciona.</p>",
        "<p>If you receive this email, sending authentication and verification codes is working.</p>",
      ),
    );
  } catch (e) {
    const detail = (e instanceof Error ? e.message : String(e)).slice(0, 200);
    throw await errorPanel(502, `No se pudo enviar la prueba: ${detail}`, `Could not send the test: ${detail}`);
  }
  return Response.json({ ok: true });
});
