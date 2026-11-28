import { NextResponse } from "next/server";
import { prisma, asegurarEsquema } from "@/lib/prisma";
import { getCustomer, startCustomerSession } from "@/lib/customer-auth";
import { nonceCaducado } from "@/lib/telegram";
import { urlAvatar } from "@/lib/avatar";

/**
 * El navegador pregunta si el bot ya confirmó el enlace. Cuando lo confirma, se
 * abre la sesión aquí y el nonce queda gastado: un enlace no sirve dos veces.
 */
export async function GET(req: Request) {
  const nonce = new URL(req.url).searchParams.get("nonce") ?? "";
  if (!/^[\w-]{16,64}$/.test(nonce)) return NextResponse.json({ estado: "desconocido" }, { status: 400 });

  await asegurarEsquema();
  const fila = await prisma.telegramLogin.findUnique({ where: { nonce } });
  if (!fila) return NextResponse.json({ estado: "desconocido" });
  if (fila.usadoEn) return NextResponse.json({ estado: "caducado" });
  if (fila.estado !== "confirmado" || !fila.telegramId) {
    return NextResponse.json({ estado: (await nonceCaducado(fila.creadoEn)) ? "caducado" : "pendiente" });
  }

  const foto = urlAvatar(fila.foto);
  const conSesion = await getCustomer();
  if (conSesion) {
    const ocupado = await prisma.customer.findUnique({ where: { telegramId: fila.telegramId }, select: { id: true } });
    if (ocupado && ocupado.id !== conSesion.id) return NextResponse.json({ estado: "ocupado" }, { status: 409 });
    await prisma.customer.update({ where: { id: conSesion.id }, data: { telegramId: fila.telegramId, ...(foto ? { avatarUrl: foto } : {}) } });
  } else {
    const existente = await prisma.customer.findUnique({ where: { telegramId: fila.telegramId } });
    const cliente = existente ?? (await prisma.customer.create({
      data: { telegramId: fila.telegramId, name: fila.nombre || "Cliente Telegram", ...(foto ? { avatarUrl: foto } : {}) },
    }));
    await startCustomerSession(cliente.id);
  }
  await prisma.telegramLogin.update({ where: { id: fila.id }, data: { usadoEn: new Date() } });
  return NextResponse.json({ estado: "listo", redirect: "/cuenta" });
}
