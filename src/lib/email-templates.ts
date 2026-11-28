// Plantillas de correo transaccional. Solo producen cadenas HTML: no hay JSX,
// ni CSS externo, ni scripts, así que se pueden importar desde cualquier
// contexto de servidor (rutas API, cron, scripts de mantenimiento).

import { SITE } from "./site";
import type { Idioma } from "./i18n-dict";
import { emailT, orderStatusEmailLabel } from "./email-i18n";
import { motivoTexto } from "./pedido-i18n";

const BRAND = {
  azul: "#0b2a5b",
  turquesa: "#0e7490",
  fondo: "#eef3f9",
  texto: "#334155",
  textoSuave: "#475569",
  borde: "#dbe4f0",
  fuente: `-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif`,
  mono: `'SFMono-Regular',Consolas,'Liberation Mono',Menlo,monospace`,
} as const;

export const escHtml = (s: string) =>
  String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]!));

const baseUrl = () => (process.env.PUBLIC_URL ?? "https://impacto-automotriz.vercel.app").replace(/\/+$/, "");
const logoUrl = () => `${baseUrl()}/brand/logo.png`;
const storeUrl = () => `${baseUrl()}/`;

/** Solo permite http(s), mailto, tel o rutas internas: evita `javascript:` en un href. */
const safeHref = (href: string) => (/^(https?:\/\/|mailto:|tel:|\/(?!\/))/i.test(href) ? href : storeUrl());

export type EmailCta = { label: string; href: string };

export type BrandEmailOptions = {
  /** Idioma del correo: decide el texto del pie y el atributo lang. */
  lang?: Idioma;
  /** Texto plano: se escapa dentro de la plantilla. */
  title: string;
  /** Texto plano: se escapa dentro de la plantilla. */
  intro: string;
  /** HTML de confianza: quien lo construye debe escapar los datos dinámicos. */
  bodyHtml: string;
  cta?: EmailCta;
  /** Resumen que muestran las bandejas antes de abrir el mensaje. Texto plano. */
  preheader?: string;
  /** HTML opcional antes del pie (por ejemplo, baja de campañas). */
  footerExtraHtml?: string;
};

const ctaBlock = (cta: EmailCta) => `
              <table role="presentation" cellpadding="0" cellspacing="0" border="0" class="btn" style="margin:26px 0 4px">
                <tr>
                  <td align="center" bgcolor="${BRAND.turquesa}" style="border-radius:8px">
                    <a href="${escHtml(safeHref(cta.href))}" style="display:inline-block;padding:14px 30px;font-family:${BRAND.fuente};font-size:15px;font-weight:700;line-height:1.2;color:#ffffff;text-decoration:none;border-radius:8px">${escHtml(cta.label)}</a>
                  </td>
                </tr>
              </table>`;

/** Envoltorio común: fondo claro, tarjeta central de 600px, cabecera con logo y pie legal. */
export function brandEmail({ lang = "es", title, intro, bodyHtml, cta, preheader, footerExtraHtml }: BrandEmailOptions): string {
  const anio = new Date().getFullYear();
  const tienda = escHtml(storeUrl());

  return `<!doctype html>
<html lang="${lang}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
<meta http-equiv="Content-Language" content="${lang}">
<meta name="x-apple-disable-message-reformatting">
<meta name="format-detection" content="telephone=no,address=no,email=no,date=no">
<title>${escHtml(title)}</title>
<style>
  body,table,td,a{-webkit-text-size-adjust:100%;-ms-text-size-adjust:100%}
  table,td{mso-table-lspace:0pt;mso-table-rspace:0pt}
  img{-ms-interpolation-mode:bicubic;border:0;outline:none;text-decoration:none;height:auto;line-height:100%}
  body{margin:0;padding:0;width:100%!important;background:${BRAND.fondo}}
  a{color:${BRAND.turquesa}}
  @media only screen and (max-width:600px){
    .wrap{padding:18px 10px!important}
    .card{border-radius:10px!important}
    .pad{padding:22px 20px 26px!important}
    .h1{font-size:21px!important}
    .btn a{display:block!important;padding:15px 20px!important}
    .pin{font-size:32px!important;letter-spacing:8px!important}
  }
</style>
<!--[if mso]>
<xml><o:OfficeDocumentSettings><o:PixelsPerInch>96</o:PixelsPerInch></o:OfficeDocumentSettings></xml>
<![endif]-->
</head>
<body style="margin:0;padding:0;background:${BRAND.fondo};">
<div style="display:none;max-height:0;max-width:0;overflow:hidden;opacity:0;color:transparent;mso-hide:all;">${escHtml(preheader ?? intro)}</div>
<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:${BRAND.fondo};">
  <tr>
    <td align="center" class="wrap" style="padding:32px 16px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" class="card" style="width:100%;max-width:600px;background:#ffffff;border:1px solid ${BRAND.borde};border-radius:14px;overflow:hidden;">
        <tr><td bgcolor="${BRAND.azul}" style="height:6px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr><td bgcolor="${BRAND.turquesa}" style="height:3px;font-size:0;line-height:0;">&nbsp;</td></tr>
        <tr>
          <td align="center" style="padding:26px 32px 4px;">
            <a href="${tienda}" style="text-decoration:none;">
              <img src="${escHtml(logoUrl())}" width="152" alt="${escHtml(SITE.nombre)}" style="display:block;width:152px;max-width:62%;height:auto;border:0;">
            </a>
          </td>
        </tr>
        <tr>
          <td class="pad" style="padding:6px 32px 32px;font-family:${BRAND.fuente};font-size:15px;line-height:1.65;color:${BRAND.texto};">
            <h1 class="h1" style="margin:10px 0 14px;font-family:${BRAND.fuente};font-size:23px;line-height:1.3;font-weight:700;color:${BRAND.azul};">${escHtml(title)}</h1>
            ${intro ? `<p style="margin:0 0 18px;color:${BRAND.textoSuave};">${escHtml(intro)}</p>` : ""}
${bodyHtml}${cta ? ctaBlock(cta) : ""}
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td align="center" style="padding:22px 14px 0;font-family:${BRAND.fuente};font-size:12px;line-height:1.6;color:#64748b;">
            <p style="margin:0 0 6px;font-weight:700;color:${BRAND.azul};">${escHtml(SITE.razonSocial)}</p>
            <p style="margin:0 0 6px;">${escHtml(SITE.direccion)}</p>
            <p style="margin:0 0 10px;">${escHtml(emailT(lang, "footer.account"))} <a href="${tienda}" style="color:${BRAND.turquesa};text-decoration:underline;">${escHtml(SITE.nombre)}</a>.</p>
            ${footerExtraHtml ?? ""}
            <p style="margin:0;color:#94a3b8;">&copy; ${anio} ${escHtml(SITE.razonSocial)}</p>
          </td>
        </tr>
      </table>
    </td>
  </tr>
</table>
</body>
</html>`;
}

/** Código de 6 dígitos para confirmar la cuenta. */
export function verificationEmail({ name, pin, lang = "es" }: { name: string; pin: string; lang?: Idioma }): string {
  return brandEmail({
    lang,
    title: emailT(lang, "verification.title"),
    preheader: emailT(lang, "verification.preheader", { pin }),
    intro: emailT(lang, "verification.intro", { name }),
    bodyHtml: `
              <ol style="margin:0 0 20px;padding-left:20px;color:${BRAND.textoSuave};">
                <li style="margin:0 0 6px;">${escHtml(emailT(lang, "verification.step1", { site: SITE.nombre }))}</li>
                <li style="margin:0 0 6px;">${escHtml(emailT(lang, "verification.step2"))}</li>
                <li style="margin:0;">${escHtml(emailT(lang, "verification.step3"))}</li>
              </ol>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td align="center" bgcolor="#f1f7fb" style="background:#f1f7fb;border:1px solid #cfe3ef;border-radius:10px;padding:20px 12px;">
                    <div class="pin" style="font-family:${BRAND.mono};font-size:38px;line-height:1.2;letter-spacing:12px;font-weight:700;color:${BRAND.azul};">${escHtml(pin)}</div>
                    <div style="margin-top:8px;font-family:${BRAND.fuente};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.turquesa};">${escHtml(emailT(lang, "verification.expires"))}</div>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 14px;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "verification.singleUse"))}</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
                <tr>
                  <td style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:6px;padding:12px 14px;font-family:${BRAND.fuente};font-size:13px;line-height:1.55;color:#7c4a03;">
                    <strong>${escHtml(emailT(lang, "verification.warning"))}</strong> ${escHtml(emailT(lang, "verification.warningText", { site: SITE.nombre }))}
                  </td>
                </tr>
              </table>`,
  });
}

/** Enlace de verificación heredado (correos ya enviados con token). */
export function verificationLinkEmail({ name, url, lang = "es" }: { name: string; url: string; lang?: Idioma }): string {
  return brandEmail({
    lang,
    title: emailT(lang, "verification.title"),
    preheader: emailT(lang, "verification.linkPreheader"),
    intro: emailT(lang, "verification.linkIntro", { name }),
    bodyHtml: `<p style="margin:0;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "verification.linkExpires"))}</p>`,
    cta: { label: emailT(lang, "verification.linkCta"), href: url },
  });
}

/** Bienvenida tras crear la cuenta. */
export function welcomeEmail({ name, email, lang = "es" }: { name: string; email: string; lang?: Idioma }): string {
  const items: [string, string][] = [1, 2, 3, 4, 5].map((n) => [
    emailT(lang, `welcome.item${n}.title`),
    emailT(lang, `welcome.item${n}.text`),
  ]);
  return brandEmail({
    lang,
    title: emailT(lang, "welcome.title"),
    preheader: emailT(lang, "welcome.preheader"),
    intro: emailT(lang, "welcome.intro", { name, email }),
    bodyHtml: `
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 8px;">
${items
  .map(
    ([titulo, texto]) => `                <tr>
                  <td style="padding:10px 0;border-bottom:1px solid ${BRAND.borde};">
                    <div style="font-family:${BRAND.fuente};font-size:14px;font-weight:700;color:${BRAND.azul};">${escHtml(titulo)}</div>
                    <div style="margin-top:2px;font-family:${BRAND.fuente};font-size:14px;line-height:1.55;color:${BRAND.textoSuave};">${escHtml(texto)}</div>
                  </td>
                </tr>`,
  )
  .join("\n")}
              </table>
              <p style="margin:16px 0 0;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "welcome.unrecognized", { email: SITE.email }))}</p>`,
    cta: { label: emailT(lang, "common.ctaAccount"), href: `${baseUrl()}/cuenta` },
  });
}

export type OrderConfirmationItem = { name: string; qty: number; price?: string };

const tablaProductos = (items: OrderConfirmationItem[] | undefined, lang: Idioma) => {
  const filas = (items ?? [])
    .map(
      (i) => `                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid ${BRAND.borde};font-family:${BRAND.fuente};font-size:14px;color:${BRAND.texto};">${escHtml(i.name)}</td>
                  <td align="center" style="padding:8px 0;border-bottom:1px solid ${BRAND.borde};font-family:${BRAND.fuente};font-size:14px;color:${BRAND.textoSuave};white-space:nowrap;">x${i.qty}</td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid ${BRAND.borde};font-family:${BRAND.fuente};font-size:14px;color:${BRAND.texto};white-space:nowrap;">${escHtml(i.price ?? "")}</td>
                </tr>`,
    )
    .join("\n");
  return filas
    ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
                <tr>
                  <td style="padding:0 0 6px;font-family:${BRAND.fuente};font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">${escHtml(emailT(lang, "order.product"))}</td>
                  <td align="center" style="padding:0 0 6px;font-family:${BRAND.fuente};font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">${escHtml(emailT(lang, "order.qty"))}</td>
                  <td align="right" style="padding:0 0 6px;font-family:${BRAND.fuente};font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">${escHtml(emailT(lang, "order.amount"))}</td>
                </tr>
${filas}
              </table>`
    : "";
};

const pinBloque = (pin: string | undefined, lang: Idioma) =>
  pin
    ? `<p style="margin:0 0 16px;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "common.pin"))}: <strong style="font-family:${BRAND.mono};font-size:18px;letter-spacing:3px;color:${BRAND.azul};">${escHtml(pin)}</strong>. ${escHtml(emailT(lang, "common.pinHelp"))}</p>`
    : "";

/** Confirmación de pedido. */
export function orderConfirmationEmail({
  name,
  orderNumber,
  total,
  items,
  trackingUrl,
  deliveryPin,
  lang = "es",
}: {
  name: string;
  orderNumber: number | string;
  total?: string;
  items?: OrderConfirmationItem[];
  trackingUrl?: string;
  deliveryPin?: string;
  lang?: Idioma;
}): string {
  return brandEmail({
    lang,
    title: emailT(lang, "order.title", { number: orderNumber }),
    preheader: total
      ? emailT(lang, "order.preheader", { number: orderNumber, total })
      : emailT(lang, "order.preheaderNoTotal", { number: orderNumber }),
    intro: emailT(lang, "order.intro", { name }),
    bodyHtml: `
              ${tablaProductos(items, lang)}
              ${total ? `<p style="margin:0 0 16px;font-family:${BRAND.fuente};font-size:16px;font-weight:700;color:${BRAND.azul};">${escHtml(emailT(lang, "order.total", { total }))}</p>` : ""}
              ${pinBloque(deliveryPin, lang)}
              <p style="margin:0;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "order.follow"))}</p>`,
    cta: { label: emailT(lang, "common.ctaOrder"), href: trackingUrl ?? `${baseUrl()}/cuenta` },
  });
}

/** Cambio de estado de un pedido (también sirve para confirmar el pago). */
export function orderStatusEmail({
  name,
  orderNumber,
  status,
  trackingUrl,
  deliveryPin,
  lang = "es",
}: {
  name: string;
  orderNumber: number | string;
  status: string;
  trackingUrl?: string;
  deliveryPin?: string;
  lang?: Idioma;
}): string {
  const label = orderStatusEmailLabel(lang, status);
  return brandEmail({
    lang,
    title: emailT(lang, "status.title", { number: orderNumber, status: label.toLowerCase() }),
    preheader: emailT(lang, "status.subject", { number: orderNumber, status: label }),
    intro: emailT(lang, "status.intro", { name, status: label }),
    bodyHtml: `
              <p style="margin:0 0 16px;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "status.tracking"))}</p>
              ${pinBloque(deliveryPin, lang)}`,
    cta: trackingUrl ? { label: emailT(lang, "common.ctaOrder"), href: trackingUrl } : undefined,
  });
}

export function orderItemRemovedEmail({
  name,
  orderNumber,
  itemName,
  qty,
  reason,
  total,
  trackingUrl,
  lang = "es",
}: {
  name: string;
  orderNumber: number | string;
  itemName: string;
  qty: number;
  reason: string;
  total?: string;
  trackingUrl?: string;
  lang?: Idioma;
}): string {
  return brandEmail({
    lang,
    title: emailT(lang, "removed.title", { number: orderNumber }),
    preheader: emailT(lang, "removed.subject", { number: orderNumber }),
    intro: emailT(lang, "removed.intro", { name, item: itemName, qty, number: orderNumber }),
    bodyHtml: `
              <p style="margin:0 0 12px;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "removed.reason", { reason: motivoTexto(reason, lang) }))}</p>
              <p style="margin:0;color:${BRAND.textoSuave};">${escHtml(total ? emailT(lang, "removed.total", { total }) : emailT(lang, "order.follow"))}</p>`,
    cta: trackingUrl ? { label: emailT(lang, "common.ctaOrder"), href: trackingUrl } : undefined,
  });
}

export function passwordResetEmail({ name, url, lang = "es" }: { name?: string; url: string; lang?: Idioma }): string {
  return brandEmail({
    lang,
    title: emailT(lang, "reset.title"),
    preheader: emailT(lang, "reset.preheader"),
    intro: name ? `${emailT(lang, "common.hello", { name })}. ${emailT(lang, "reset.intro")}` : emailT(lang, "reset.intro"),
    bodyHtml: `
              <p style="margin:0 0 12px;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "reset.expires"))}</p>
              <p style="margin:0;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "reset.ignore"))}</p>`,
    cta: { label: emailT(lang, "reset.cta"), href: url },
  });
}

export function subscriptionConfirmEmail({ name, url, lang = "es" }: { name?: string | null; url: string; lang?: Idioma }): string {
  return brandEmail({
    lang,
    title: emailT(lang, "subscribe.title"),
    preheader: emailT(lang, "subscribe.preheader"),
    intro: name ? `${emailT(lang, "common.hello", { name })}. ${emailT(lang, "subscribe.intro")}` : emailT(lang, "subscribe.intro"),
    bodyHtml: `<p style="margin:0;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "subscribe.ignore"))}</p>`,
    cta: { label: emailT(lang, "subscribe.cta"), href: url },
  });
}

export function backInStockEmail({ name, productName, productUrl, lang = "es" }: { name?: string | null; productName: string; productUrl: string; lang?: Idioma }): string {
  return brandEmail({
    lang,
    title: emailT(lang, "stock.title"),
    preheader: emailT(lang, "stock.subject", { product: productName }),
    intro: name ? `${emailT(lang, "common.hello", { name })}. ${emailT(lang, "stock.intro", { product: productName })}` : emailT(lang, "stock.intro", { product: productName }),
    bodyHtml: "",
    cta: { label: emailT(lang, "common.ctaCatalog"), href: productUrl },
  });
}

export function adminOrderEmail({
  orderNumber,
  customerName,
  customerEmail,
  total,
  items,
  proformaUrl,
  lang = "es",
}: {
  orderNumber: number | string;
  customerName: string;
  customerEmail: string;
  total: string;
  items?: OrderConfirmationItem[];
  proformaUrl: string;
  lang?: Idioma;
}): string {
  return brandEmail({
    lang,
    title: emailT(lang, "adminOrder.title", { number: orderNumber }),
    preheader: emailT(lang, "adminOrder.preheader", { customer: customerName, total }),
    intro: emailT(lang, "adminOrder.intro"),
    bodyHtml: `
              ${tablaProductos(items, lang)}
              <p style="margin:0 0 8px;color:${BRAND.textoSuave};">${escHtml(emailT(lang, "adminOrder.customer", { name: customerName, email: customerEmail }))}</p>
              <p style="margin:0;font-weight:700;color:${BRAND.azul};">${escHtml(emailT(lang, "adminOrder.total", { total }))}</p>`,
    cta: { label: emailT(lang, "adminOrder.cta"), href: proformaUrl },
  });
}

export function testEmail({ lang = "es" }: { lang?: Idioma } = {}): string {
  return brandEmail({
    lang,
    title: emailT(lang, "test.title"),
    preheader: emailT(lang, "test.subject"),
    intro: emailT(lang, "test.intro"),
    bodyHtml: "",
  });
}

/** Envuelve el HTML libre de una campaña en la plantilla de marca. */
export function campaignEmail({ subject, html, lang = "es", unsubscribeUrl }: { subject: string; html: string; lang?: Idioma; unsubscribeUrl?: string }): string {
  // Aunque el panel permita pegar HTML completo, el correo siempre sale con la
  // cabecera y el pie de la marca: se quitan solo las etiquetas del documento.
  const cuerpo = html.replace(/<!doctype[^>]*>/gi, "").replace(/<\/?html[^>]*>/gi, "").replace(/<\/?head[^>]*>/gi, "").replace(/<\/?body[^>]*>/gi, "");
  const footerExtraHtml = unsubscribeUrl
    ? `<p style="margin:0 0 6px;">${escHtml(emailT(lang, "footer.campaign"))} <a href="${escHtml(safeHref(unsubscribeUrl))}" style="color:${BRAND.turquesa};text-decoration:underline;">${escHtml(emailT(lang, "footer.unsubscribe"))}</a></p>`
    : undefined;
  return brandEmail({ lang, title: subject, intro: "", bodyHtml: cuerpo, footerExtraHtml });
}
