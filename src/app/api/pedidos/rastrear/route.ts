import { prisma } from "@/lib/prisma";
import { handle, HttpError } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { orderToken } from "@/lib/order-access";
import { requireTurnstile } from "@/lib/turnstile";

export const dynamic = "force-dynamic";

// Comparación sin cortocircuito: con un === normal, el tiempo de respuesta
// deja adivinar el correo letra a letra.
const igual = (a: string, b: string) => {
  const x = a.trim().toLowerCase(), y = b.trim().toLowerCase();
  if (x.length !== y.length) return false;
  let d = 0;
  for (let i = 0; i < x.length; i++) d |= x.charCodeAt(i) ^ y.charCodeAt(i);
  return d === 0;
};

const soloDigitos = (v: string) => v.replace(/\D/g, "");

export const POST = handle(async (req: Request) => {
  // Sin límite, esto sirve para recorrer los números de pedido uno a uno.
  await limit(req, "rastreo", 10);

  const body = await req.json().catch(() => null);
  await requireTurnstile(req, typeof body?.turnstileToken === "string" ? body.turnstileToken : undefined);
  const numero = Number(body?.numero);
  const contacto = typeof body?.contacto === "string" ? body.contacto : "";
  if (!Number.isInteger(numero) || numero <= 0 || contacto.length < 5) {
    throw new HttpError(400, "Escribe el número de pedido y el contacto con el que compraste.");
  }

  const pedido = await prisma.order.findUnique({
    where: { number: numero },
    select: { id: true, customerEmail: true, customerPhone: true },
  });

  // Un mismo mensaje para "no existe" y "no coincide": distinguirlos permitiría
  // averiguar qué números de pedido existen.
  const noEncontrado = new HttpError(404, "No encontramos un pedido con esos datos. Revisa el número y el contacto.");
  if (!pedido) throw noEncontrado;

  const porEmail = igual(pedido.customerEmail, contacto);
  const tel = soloDigitos(pedido.customerPhone);
  const porTelefono = tel.length >= 6 && igual(tel, soloDigitos(contacto));
  if (!porEmail && !porTelefono) throw noEncontrado;

  // Ya está autorizado: se entrega el enlace firmado que usa la ficha del pedido.
  return Response.json({ url: `/pedido/${pedido.id}?t=${orderToken(pedido.id)}` });
});
