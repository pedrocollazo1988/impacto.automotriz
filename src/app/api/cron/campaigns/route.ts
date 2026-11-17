import { processQueue } from "@/lib/mailer";
import { prisma } from "@/lib/prisma";

// Llamar cada minuto: Vercel Cron o crontab del servidor (ver README).
export async function GET(req: Request) {
  if (!process.env.CRON_SECRET || req.headers.get("authorization") !== `Bearer ${process.env.CRON_SECRET}`)
    return new Response("Unauthorized", { status: 401 });
  await prisma.rateLimit.deleteMany({ where: { resetAt: { lt: new Date() } } }).catch(() => {});
  return Response.json(await processQueue());
}
