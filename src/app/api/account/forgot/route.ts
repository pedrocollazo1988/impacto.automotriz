import crypto from "node:crypto";
import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { handle } from "@/lib/auth";
import { limit } from "@/lib/ratelimit";
import { sendTransactional } from "@/lib/mailer";

// Siempre responde igual, exista o no la cuenta (no revela qué correos están registrados).
export const POST = handle(async (req: Request) => {
  await limit(req, "forgot", 3);
  const { email } = z.object({ email: z.string().email().transform((s) => s.toLowerCase()) }).parse(await req.json());
  const c = await prisma.customer.findUnique({ where: { email } });
  if (c) {
    const token = crypto.randomBytes(32).toString("hex");
    await prisma.authToken.create({ data: { customerId: c.id, kind: "RESET", tokenHash: crypto.createHash("sha256").update(token).digest("hex"), expiresAt: new Date(Date.now() + 3600_000) } });
    sendTransactional(email, "Restablecer contraseña", `<p>Para crear una nueva contraseña entra aquí (válido 1 hora):</p><p><a href="${process.env.PUBLIC_URL}/cuenta/restablecer?token=${token}">Restablecer contraseña</a></p>`).catch(() => {});
  }
  return Response.json({ ok: true });
});
