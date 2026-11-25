import { z } from "zod";
import { handle, requireAdmin, HttpError } from "@/lib/auth";
import { sendTest } from "@/lib/mailer";

export const POST = handle(async (req: Request) => {
  await requireAdmin(req, "email");
  const { to } = z.object({ to: z.string().email() }).parse(await req.json());
  try {
    await sendTest(to, "Prueba de configuración", "<p>Si recibes este correo, el envío de autenticación y códigos de verificación ya funciona.</p>");
  } catch (e) {
    const detail = e instanceof Error ? e.message : String(e);
    throw new HttpError(502, `No se pudo enviar la prueba: ${detail.slice(0, 200)}`);
  }
  return Response.json({ ok: true });
});
