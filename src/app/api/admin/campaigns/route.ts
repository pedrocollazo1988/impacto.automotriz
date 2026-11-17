import { z } from "zod";
import { prisma } from "@/lib/prisma";
import { audit, handle, requireAdmin, HttpError } from "@/lib/auth";
import { audienceWhere, sendTest, type Segment } from "@/lib/mailer";

export const GET = handle(async (req: Request) => {
  const u = await requireAdmin(req, "email");
  const list = await prisma.campaign.findMany({ orderBy: { id: "desc" }, include: { _count: { select: { sends: true } } } });
  return Response.json(list);
});

const Body = z.discriminatedUnion("action", [
  z.object({ action: z.literal("save"), id: z.number().int().optional(), name: z.string().min(2), subject: z.string().min(2).max(150),
    html: z.string().min(10), segment: z.object({ provinceIds: z.array(z.number().int()).optional(), tags: z.array(z.string()).optional() }).optional() }),
  z.object({ action: z.literal("preview"), id: z.number().int() }),   // cuántos destinatarios
  z.object({ action: z.literal("test"), id: z.number().int(), to: z.string().email() }),
  z.object({ action: z.literal("send"), id: z.number().int() }),      // pasa a cola; lo envía el cron
  z.object({ action: z.literal("cancel"), id: z.number().int() }),
]);

export const POST = handle(async (req: Request) => {
  const u = await requireAdmin(req, "email");
  const b = Body.parse(await req.json());
  if (b.action === "save") {
    const data = { name: b.name, subject: b.subject, html: b.html, segment: b.segment ?? undefined };
    if (!b.id) return Response.json(await prisma.campaign.create({ data }));
    const cur = await prisma.campaign.findUniqueOrThrow({ where: { id: b.id } });
    if (cur.status !== "DRAFT") throw new HttpError(409, "Solo se editan borradores");
    return Response.json(await prisma.campaign.update({ where: { id: b.id }, data }));
  }
  const c = await prisma.campaign.findUniqueOrThrow({ where: { id: b.id } });
  if (b.action === "preview") return Response.json({ recipients: await prisma.subscriber.count({ where: audienceWhere(c.segment as Segment) }) });
  if (b.action === "test") { await sendTest(b.to, c.subject, c.html); return Response.json({ ok: true }); }
  if (b.action === "send" || b.action === "cancel") await audit(u, `campana.${b.action}`, c.name);
  if (b.action === "send") {
    if (c.status !== "DRAFT") throw new HttpError(409, "La campaña ya fue enviada o está en curso");
    return Response.json(await prisma.campaign.update({ where: { id: c.id }, data: { status: "SENDING" } }));
  }
  return Response.json(await prisma.campaign.update({ where: { id: c.id }, data: { status: "CANCELED" } }));
});
