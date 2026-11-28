import { NextResponse } from "next/server";
import { asegurarEsquema } from "@/lib/prisma";
import { crearEnlaceTelegram, estadoTelegram } from "@/lib/telegram";

/** Crea un enlace t.me con nonce: el camino que funciona en el móvil. */
export async function POST() {
  const { configurado, usuario } = estadoTelegram();
  if (!configurado) return NextResponse.json({ ok: false }, { status: 400 });
  await asegurarEsquema();
  const { nonce, url } = await crearEnlaceTelegram(usuario);
  return NextResponse.json({ ok: true, nonce, url });
}
