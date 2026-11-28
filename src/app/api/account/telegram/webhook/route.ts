import { prisma, asegurarEsquema } from "@/lib/prisma";
import { comandoStart, enviarMensaje, nonceCaducado } from "@/lib/telegram";

type TelegramUpdate = {
  message?: {
    text?: string;
    chat?: { id?: number | string };
    from?: { id?: number; first_name?: string; last_name?: string; username?: string };
  };
};

/**
 * Webhook del bot. Telegram lo llama cuando el cliente pulsa Iniciar en el
 * enlace. Se responde 200 siempre que el secreto cuadre: si devolviéramos error,
 * Telegram reintentaría el mismo mensaje en bucle.
 */
export async function POST(req: Request) {
  const secreto = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (!secreto || req.headers.get("x-telegram-bot-api-secret-token") !== secreto) {
    return new Response("no autorizado", { status: 401 });
  }

  const update = (await req.json().catch(() => null)) as TelegramUpdate | null;
  const mensaje = update?.message;
  const chatId = mensaje?.chat?.id != null ? String(mensaje.chat.id) : "";
  const nonce = comandoStart(mensaje?.text);
  if (!chatId || !nonce) return Response.json({ ok: true });

  await asegurarEsquema();
  const fila = await prisma.telegramLogin.findUnique({ where: { nonce } });
  if (!fila || fila.estado !== "pendiente" || (await nonceCaducado(fila.creadoEn))) {
    await enviarMensaje(chatId, "Ese enlace ya no sirve. Vuelve a la web de Impacto Automotriz y pide uno nuevo.");
    return Response.json({ ok: true });
  }

  const de = mensaje?.from ?? {};
  const nombre = [de.first_name, de.last_name].map((v) => (v ?? "").trim()).filter(Boolean).join(" ");
  await prisma.telegramLogin.update({
    where: { id: fila.id },
    data: {
      estado: "confirmado",
      telegramId: String(de.id ?? ""),
      chatId,
      nombre: (nombre || de.username || "Cliente Telegram").slice(0, 120),
      usuario: de.username ?? null,
      confirmadoEn: new Date(),
    },
  });
  await enviarMensaje(chatId, "Listo. Vuelve a la web de Impacto Automotriz: ya estás dentro.");
  return Response.json({ ok: true });
}
