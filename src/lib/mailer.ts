import nodemailer from "nodemailer";
import crypto from "node:crypto";
import type { Prisma, EmailSettings } from "@prisma/client";
import { prisma } from "./prisma";
import { backInStockEmail, campaignEmail, testEmail } from "./email-templates";
import { emailLang, emailT } from "./email-i18n";
import { textoPanel } from "./auth";
import { getLang, type Idioma } from "./i18n";

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

export type MailConfig = {
  fromName: string;
  fromEmail: string;
  replyTo?: string | null;
  smtpHost: string;
  smtpPort: number;
  smtpSecure: boolean;
  smtpUser: string;
  smtpPass: string;
  perMinute: number;
  dailyLimit: number;
  companyInfo: string;
  source: "db" | "env";
};
export type SendResult = { ok: true } | { ok: false; error: string };

const fromDb = (s: EmailSettings): MailConfig => ({
  fromName: s.fromName, fromEmail: s.fromEmail, replyTo: s.replyTo,
  smtpHost: s.smtpHost, smtpPort: s.smtpPort, smtpSecure: s.smtpSecure,
  smtpUser: s.smtpUser, smtpPass: decrypt(s.smtpPassEnc),
  perMinute: s.perMinute, dailyLimit: s.dailyLimit, companyInfo: s.companyInfo, source: "db",
});

// Alternativa para despliegues sin fila en EmailSettings. Permite configurar el
// correo desde Vercel sin entrar al panel, que es lo que suele faltar cuando
// "no llega ningún correo" tras un despliegue nuevo.
const fromEnv = (): MailConfig | null => {
  const host = process.env.SMTP_HOST?.trim();
  const user = process.env.SMTP_USER?.trim();
  const pass = process.env.SMTP_PASS;
  const fromEmail = (process.env.MAIL_FROM_EMAIL ?? user)?.trim();
  if (!host || !user || !pass || !fromEmail) return null;
  return {
    fromName: process.env.MAIL_FROM_NAME?.trim() || "Impacto Automotriz",
    fromEmail,
    replyTo: process.env.MAIL_REPLY_TO?.trim() || null,
    smtpHost: host,
    smtpPort: Number(process.env.SMTP_PORT ?? 587),
    smtpSecure: String(process.env.SMTP_SECURE ?? "false").toLowerCase() === "true",
    smtpUser: user,
    smtpPass: pass,
    perMinute: Number(process.env.MAIL_PER_MINUTE ?? 20),
    dailyLimit: Number(process.env.MAIL_DAILY_LIMIT ?? 300),
    companyInfo: process.env.MAIL_COMPANY_INFO?.trim() || "Impacto Automotriz S.U.R.L.",
    source: "env",
  };
};

export async function loadMailConfig(): Promise<MailConfig | null> {
  const s = await prisma.emailSettings.findUnique({ where: { id: 1 } }).catch((e) => {
    console.error("[correo] No se pudo leer EmailSettings:", e instanceof Error ? e.message : e);
    return null;
  });
  if (s) {
    try { return fromDb(s); }
    catch (e) {
      console.error("[correo] No se pudo descifrar la contraseña SMTP. ¿Cambió APP_SECRET?", e instanceof Error ? e.message : e);
    }
  }
  return fromEnv();
}

export async function mailStatus() {
  const c = await loadMailConfig();
  return c
    ? { configured: true, source: c.source, host: c.smtpHost, port: c.smtpPort, fromEmail: c.fromEmail }
    : { configured: false, source: null, host: null, port: null, fromEmail: null };
}

const transportFor = (c: MailConfig) =>
  nodemailer.createTransport({
    host: c.smtpHost, port: c.smtpPort, secure: c.smtpSecure,
    auth: { user: c.smtpUser, pass: c.smtpPass },
    connectionTimeout: 10_000, greetingTimeout: 10_000, socketTimeout: 20_000,
  });

// Se mantiene para el panel, que guarda y verifica la configuración de la base.
export const getTransport = (s: EmailSettings) => transportFor(fromDb(s));

export type Segment = { provinceIds?: number[]; tags?: string[] };
export const audienceWhere = (s?: Segment | null): Prisma.SubscriberWhereInput => ({
  status: "ACTIVE",
  ...(s?.provinceIds?.length ? { provinceId: { in: s.provinceIds } } : {}),
  ...(s?.tags?.length ? { tags: { hasSome: s.tags } } : {}),
});

// Sin nombre en la ficha, el saludo usa un genérico en el idioma del correo.
const SALUDO_CLIENTE: Record<Idioma, string> = { es: "cliente", en: "customer" };

function render(html: string, to: { email: string; name?: string | null }, c: MailConfig, lang: Idioma = "es") {
  const body = html.replaceAll("{{nombre}}", esc(to.name ?? SALUDO_CLIENTE[lang]));
  return `${body}<hr style="margin-top:32px;border:0;border-top:1px solid #ddd"><p style="font:12px Arial;color:#777">${esc(c.companyInfo)} · ${esc(emailT(lang, "footer.campaign"))} <a href="${unsubUrl(to.email)}">${esc(emailT(lang, "footer.unsubscribe"))}</a></p>`;
}

const errorText = (e: unknown) => (e instanceof Error ? e.message : String(e)).slice(0, 300);

async function deliver(c: MailConfig, to: { email: string; name?: string | null }, subject: string, html: string, footer: boolean, lang: Idioma = "es", unsubscribeHeader = false): Promise<SendResult> {
  try {
    const tr = transportFor(c);
    await tr.sendMail({
      from: `"${c.fromName}" <${c.fromEmail}>`, replyTo: c.replyTo ?? undefined, to: to.email, subject,
      html: footer ? render(html, to, c, lang) : html,
      ...(footer || unsubscribeHeader ? { headers: { "List-Unsubscribe": `<${unsubUrl(to.email)}>`, "List-Unsubscribe-Post": "List-Unsubscribe=One-Click" } } : {}),
    });
    return { ok: true };
  } catch (e) {
    console.error(`[correo] Falló el envío a ${to.email}:`, errorText(e));
    return { ok: false, error: errorText(e) };
  }
}

export async function sendTest(to: string, subject: string, html?: string) {
  const c = await loadMailConfig();
  if (!c) throw new Error(await textoPanel("Configura la cuenta de correo (o define SMTP_HOST, SMTP_USER, SMTP_PASS y MAIL_FROM_EMAIL)", "Set up the email account (or define SMTP_HOST, SMTP_USER, SMTP_PASS and MAIL_FROM_EMAIL)"));
  const lang = await getLang();
  const cuerpo = html ? campaignEmail({ subject, html, lang }) : testEmail({ lang });
  const etiqueta = lang === "en" ? "TEST" : "PRUEBA";
  const r = await deliver(c, { email: to, name: lang === "en" ? "Test" : "Prueba" }, `[${etiqueta}] ${subject}`, cuerpo, false, lang);
  if (!r.ok) throw new Error(r.error);
}

// Se ejecuta cada minuto (cron). Envía por lotes respetando límite por minuto y diario,
// para no ser marcado como spam por el proveedor del dominio y evitar timeouts del servidor.
export async function processQueue() {
  const c = await loadMailConfig();
  if (!c) return { sent: 0, note: await textoPanel("Sin configuración de correo", "No email configuration") };
  const day = new Date(); day.setHours(0, 0, 0, 0);
  const today = await prisma.campaignSend.count({ where: { status: "SENT", sentAt: { gte: day } } });
  let budget = Math.min(c.perMinute, c.dailyLimit - today);
  if (budget <= 0) return { sent: 0, note: await textoPanel("Límite diario alcanzado", "Daily limit reached") };
  let sent = 0;
  for (const campaign of await prisma.campaign.findMany({ where: { status: "SENDING" }, orderBy: { id: "asc" } })) {
    if (budget <= 0) break;
    const subs = await prisma.subscriber.findMany({ where: { ...audienceWhere(campaign.segment as Segment), sends: { none: { campaignId: campaign.id } } }, take: budget });
    if (!subs.length) { await prisma.campaign.update({ where: { id: campaign.id }, data: { status: "SENT", sentAt: new Date() } }); continue; }
    for (const sub of subs) {
      const lang = emailLang(sub.lang);
      const html = campaignEmail({ subject: campaign.subject, html: campaign.html, lang, unsubscribeUrl: unsubUrl(sub.email) });
      const r = await deliver(c, sub, campaign.subject, html, false, lang, true);
      await prisma.campaignSend.create({ data: { campaignId: campaign.id, subscriberId: sub.id, status: r.ok ? "SENT" : "FAILED", error: r.ok ? undefined : r.error } });
      if (r.ok) sent++;
      budget--;
    }
  }
  return { sent };
}

// Correos transaccionales (confirmación de pedido, cambio de estado, PIN de entrega...).
// Devuelve el resultado para que quien llama pueda avisar al usuario si el correo no salió.
export async function sendTransactional(to: string, subject: string, html: string): Promise<SendResult> {
  const c = await loadMailConfig();
  if (!c) {
    const error = await textoPanel("No hay configuración SMTP (panel de correo o variables SMTP_HOST/SMTP_USER/SMTP_PASS/MAIL_FROM_EMAIL)", "No SMTP configuration (email panel or SMTP_HOST/SMTP_USER/SMTP_PASS/MAIL_FROM_EMAIL variables)");
    console.error(`[correo] ${error}; no se envió "${subject}" a ${to}`);
    return { ok: false, error };
  }
  return deliver(c, { email: to }, subject, html, false);
}

// Aviso "ya hay existencias": llamar cuando el inventario de un producto pase de 0 a >0.
export async function notifyBackInStock(productId: string, productName: string, productUrl: string) {
  const alerts = await prisma.stockAlert.findMany({ where: { productId, notifiedAt: null } });
  for (const a of alerts) {
    const lang = emailLang(a.lang);
    const r = await sendTransactional(a.email, emailT(lang, "stock.subject", { product: productName }), backInStockEmail({ productName, productUrl, lang }));
    if (r.ok) await prisma.stockAlert.update({ where: { id: a.id }, data: { notifiedAt: new Date() } });
  }
}

// Doble confirmación de suscripción (enlace firmado en el correo de confirmación)
export const confirmToken = (email: string) => crypto.createHmac("sha256", secret()).update(`confirm:${email.toLowerCase()}`).digest("hex");
export const validConfirmToken = (email: string, t: string) => { const a = Buffer.from(confirmToken(email)), b = Buffer.from(t); return a.length === b.length && crypto.timingSafeEqual(a, b); };
export const confirmUrl = (email: string) => `${process.env.PUBLIC_URL}/api/email/confirm?e=${encodeURIComponent(email)}&t=${confirmToken(email)}`;
