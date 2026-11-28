import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, textoPanel } from "@/lib/auth";
import { encrypt, getTransport, mailStatus } from "@/lib/mailer";

export const GET = handle(async (req: Request) => {
  const u = await requireAdmin(req, "email");
  const s = await prisma.emailSettings.findUnique({ where: { id: 1 } });
  const status = await mailStatus();
  if (!s) return Response.json({ status });
  const { smtpPassEnc, ...safe } = s; // la contraseña nunca sale al navegador
  return Response.json({ ...safe, hasPassword: !!smtpPassEnc, status });
});

const Body = z.object({
  fromName: z.string().min(2), fromEmail: z.string().email(), replyTo: z.string().email().nullish(),
  smtpHost: z.string().min(3), smtpPort: z.number().int(), smtpSecure: z.boolean(), smtpUser: z.string().min(2),
  smtpPass: z.string().min(1).optional(), // vacío = conservar la actual
  perMinute: z.number().int().min(1).max(120).default(20), dailyLimit: z.number().int().min(1).max(5000).default(300),
  companyInfo: z.string().max(300).default("Impacto Automotriz S.U.R.L."),
});
export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "email");
  const { smtpPass, ...f } = Body.parse(await req.json());
  const cur = await prisma.emailSettings.findUnique({ where: { id: 1 } });
  const smtpPassEnc = smtpPass ? encrypt(smtpPass) : cur?.smtpPassEnc;
  if (!smtpPassEnc) return Response.json({ error: await textoPanel("Falta la contraseña SMTP", "SMTP password is missing") }, { status: 400 });
  const s = await prisma.emailSettings.upsert({ where: { id: 1 }, create: { id: 1, ...f, smtpPassEnc }, update: { ...f, smtpPassEnc } });
  await audit(u, "correo.configurar", s.fromEmail);
  try { await getTransport(s).verify(); return Response.json({ ok: true, verified: true }); }
  catch (e) { return Response.json({ ok: true, verified: false, error: String(e).slice(0, 200) }); }
});
