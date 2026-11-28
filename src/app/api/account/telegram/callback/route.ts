import { prisma } from "@/lib/prisma";
import { assertCustomerAuthConfigured, getCustomer, startCustomerSession } from "@/lib/customer-auth";
import { verificarTelegram } from "@/lib/telegram";
import { urlAvatar } from "@/lib/avatar";

const back = (p: string) => Response.redirect(new URL(p, process.env.PUBLIC_URL), 302);

/**
 * Vuelta del widget de Telegram. Telegram firma los datos con el token del bot,
 * así que no hay que pedir nada más. Con sesión abierta el botón sirve para
 * vincular la cuenta; sin ella, entra el cliente de ese Telegram y la cuenta se
 * crea la primera vez.
 */
export async function GET(req: Request) {
  assertCustomerAuthConfigured();
  const u = verificarTelegram(new URL(req.url).searchParams);
  if (!u) return back("/cuenta?error=telegram");

  const foto = urlAvatar(u.foto);
  const conSesion = await getCustomer();

  if (conSesion) {
    const ocupado = await prisma.customer.findUnique({ where: { telegramId: u.id }, select: { id: true } });
    if (ocupado && ocupado.id !== conSesion.id) return back("/cuenta?error=telegram");
    await prisma.customer.update({ where: { id: conSesion.id }, data: { telegramId: u.id, ...(foto ? { avatarUrl: foto } : {}) } });
    return back("/cuenta");
  }

  const existente = await prisma.customer.findUnique({ where: { telegramId: u.id } });
  const cliente = existente ?? (await prisma.customer.create({ data: { telegramId: u.id, name: u.nombre, ...(foto ? { avatarUrl: foto } : {}) } }));
  await startCustomerSession(cliente.id);
  return back("/cuenta");
}
