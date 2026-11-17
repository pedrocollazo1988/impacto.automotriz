import nodemailer from "nodemailer";
import crypto from "node:crypto";
import type { Prisma, EmailSettings } from "@prisma/client";
import { prisma } from "./prisma";

const secret = () => { if (!process.env.APP_SECRET) throw new Error("Falta APP_SECRET"); return process.env.APP_SECRET; };
const key = () => crypto.createHash("sha256").update(secret()).digest();

export const encrypt = (t: string) => {
  const iv = crypto.randomBytes(12);
  const c = crypto.createCipheriv("aes-256-gcm", key(), iv);
  const enc = Buffer.concat([c.update(t, "utf8"), c.final()]);
  return [iv, c.getAuthTag(), enc].map((b) => b.toString("base64")).join(".");
};
const decrypt = (s: string) => {
  const [iv, tag, enc] = s.split(".").map((x) => Buffer.from(x, "base64"));
  const d = crypto.createDecipheriv("aes-256-gcm", key(), iv);
  d.setAuthTag(tag);
  return Buffer.concat([d.update(enc), d.final()]).toString("utf8");
};

export const unsubToken = (email: string) => crypto.createHmac("sha256", secret()).update(email.toLowerCase()).digest("hex");
export const validUnsubToken = (email: string, t: string) => {
  const a = Buffer.from(unsubToken(email)), b = Buffer.from(t);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
};
const unsubUrl = (email: string) => `${process.env.PUBLIC_URL}/api/email/unsubscribe?e=${encodeURIComponent(email)}&t=${unsubToken(email)}`;
const esc = (s: string) => s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

export const getTransport = (s: EmailSettings) =>
  nodemailer.createTransport({ host: s.smtpHost, port: s.smtpPort, secure: s.smtpSecure, auth: { user: s.smtpUser, pass: decrypt(s.smtpPassEnc) }, pool: true, maxConnections: 2 });

export type Segment = { provinceIds?: number[]; tags?: string[] };
export const audienceWhere = (s?: Segment | null): Prisma.SubscriberWhereInput => ({
  status: "ACTIVE",
  ...(s?.provinceIds?.length ? { provinceId: { in: s.provinceIds } } : {}),
  ...(s?.tags?.length ? { tags: { hasSome: s.tags } } : {}),
});

function render(html: string, to: { email: string; name?: string | null }, s: EmailSettings) {
  const body = html.replaceAll("{{nombre}}", esc(to.name ?? "cliente"));
  return `${body}<hr style="margin-top:32px;border:0;border-top:1px solid #ddd"><p style="font:12px Arial;color:#777">${esc(s.companyInfo)} · Recibes este correo porque te suscribiste en nuestra tienda. <a href="${unsubUrl(to.email)}">Darme de baja</a></p>`;
}

async function sendOne(tr: ReturnType<typeof getTransport>, s: EmailSettings, to: { email: string; name?: string | null }, subject: string, html: string) {
  await tr.sendMail({
    from: `"${s.fromName}" <${s.fromEmail}>`, replyTo: s.replyTo ?? undefined, to: to.email, subject,
    html: render(html, to, s),
    headers: { "List-Unsubscribe": `<${unsubUrl(to.email)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" },
  });
}

export async function sendTest(to: string, subject: string, html: string) {
  const s = await prisma.emailSettings.findUnique({ where: { id: 1 } });
  if (!s) throw new Error("Configura primero la cuenta de correo");
  await sendOne(getTransport(s), s, { email: to, name: "Prueba" }, `[PRUEBA] ${subject}`, html);
}

// Se ejecuta cada minuto (cron). Envía por lotes respetando límite por minuto y diario,
// para no ser marcado como spam por el proveedor del dominio y evitar timeouts del servidor.
export async function processQueue() {
  const s = await prisma.emailSettings.findUnique({ where: { id: 1 } });
  if (!s) return { sent: 0, note: "Sin configuración de correo" };
  const day = new Date(); day.setHours(0, 0, 0, 0);
  const today = await prisma.campaignSend.count({ where: { status: "SENT", sentAt: { gte: day } } });
  let budget = Math.min(s.perMinute, s.dailyLimit - today);
  if (budget <= 0) return { sent: 0, note: "Límite diario alcanzado" };
  const tr = getTransport(s);
  let sent = 0;
  for (const c of await prisma.campaign.findMany({ where: { status: "SENDING" }, orderBy: { id: "asc" } })) {
    if (budget <= 0) break;
    const subs = await prisma.subscriber.findMany({ where: { ...audienceWhere(c.segment as Segment), sends: { none: { campaignId: c.id } } }, take: budget });
    if (!subs.length) { await prisma.campaign.update({ where: { id: c.id }, data: { status: "SENT", sentAt: new Date() } }); continue; }
    for (const sub of subs) {
      try { await sendOne(tr, s, sub, c.subject, c.html); await prisma.campaignSend.create({ data: { campaignId: c.id, subscriberId: sub.id, status: "SENT" } }); sent++; }
      catch (e) { await prisma.campaignSend.create({ data: { campaignId: c.id, subscriberId: sub.id, status: "FAILED", error: String(e).slice(0, 300) } }); }
      budget--;
    }
  }
  return { sent };
}

// Correos transaccionales (confirmación de pedido, cambio de estado, PIN de entrega...)
export async function sendTransactional(to: string, subject: string, html: string) {
  const s = await prisma.emailSettings.findUnique({ where: { id: 1 } });
  if (!s) return;
  await getTransport(s).sendMail({ from: `"${s.fromName}" <${s.fromEmail}>`, to, subject, html });
}

// Aviso "ya hay existencias": llamar cuando el inventario de un producto pase de 0 a >0.
export async function notifyBackInStock(productId: string, productName: string, productUrl: string) {
  const alerts = await prisma.stockAlert.findMany({ where: { productId, notifiedAt: null } });
  for (const a of alerts) {
    await sendTransactional(a.email, `¡Ya hay existencias de ${productName}!`, `<p>El producto que esperabas ya está disponible: <a href="${productUrl}">${esc(productName)}</a>.</p>`);
    await prisma.stockAlert.update({ where: { id: a.id }, data: { notifiedAt: new Date() } });
  }
}

// Doble confirmación de suscripción (enlace firmado en el correo de confirmación)
export const confirmToken = (email: string) => crypto.createHmac("sha256", secret()).update(`confirm:${email.toLowerCase()}`).digest("hex");
export const validConfirmToken = (email: string, t: string) => { const a = Buffer.from(confirmToken(email)), b = Buffer.from(t); return a.length === b.length && crypto.timingSafeEqual(a, b); };
export const confirmUrl = (email: string) => `${process.env.PUBLIC_URL}/api/email/confirm?e=${encodeURIComponent(email)}&t=${confirmToken(email)}`;
