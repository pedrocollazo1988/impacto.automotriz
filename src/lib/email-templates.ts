// Plantillas de correo transaccional. Solo producen cadenas HTML: no hay JSX,
// ni CSS externo, ni scripts, así que se pueden importar desde cualquier
// contexto de servidor (rutas API, cron, scripts de mantenimiento).

import { SITE } from "./site";

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

const baseUrl = () => (process.env.PUBLIC_URL ?? "").replace(/\/+$/, "");
const logoUrl = () => `${baseUrl()}/brand/logo.png`;
const storeUrl = () => `${baseUrl()}/`;

/** Solo permite http(s), mailto, tel o rutas internas: evita `javascript:` en un href. */
const safeHref = (href: string) => (/^(https?:\/\/|mailto:|tel:|\/)/i.test(href) ? href : storeUrl());

export type EmailCta = { label: string; href: string };

export type BrandEmailOptions = {
  /** Texto plano: se escapa dentro de la plantilla. */
  title: string;
  /** Texto plano: se escapa dentro de la plantilla. */
  intro: string;
  /** HTML de confianza: quien lo construye debe escapar los datos dinámicos. */
  bodyHtml: string;
  cta?: EmailCta;
  /** Resumen que muestran las bandejas antes de abrir el mensaje. Texto plano. */
  preheader?: string;
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
export function brandEmail({ title, intro, bodyHtml, cta, preheader }: BrandEmailOptions): string {
  const anio = new Date().getFullYear();
  const tienda = escHtml(storeUrl());

  return `<!doctype html>
<html lang="es">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width,initial-scale=1">
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
            <p style="margin:0 0 18px;color:${BRAND.textoSuave};">${escHtml(intro)}</p>
${bodyHtml}${cta ? ctaBlock(cta) : ""}
          </td>
        </tr>
      </table>
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="width:100%;max-width:600px;">
        <tr>
          <td align="center" style="padding:22px 14px 0;font-family:${BRAND.fuente};font-size:12px;line-height:1.6;color:#64748b;">
            <p style="margin:0 0 6px;font-weight:700;color:${BRAND.azul};">${escHtml(SITE.razonSocial)}</p>
            <p style="margin:0 0 6px;">${escHtml(SITE.direccion)}</p>
            <p style="margin:0 0 10px;">Correo transaccional de tu cuenta en <a href="${tienda}" style="color:${BRAND.turquesa};text-decoration:underline;">${escHtml(SITE.nombre)}</a>.</p>
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
export function verificationEmail({ name, pin }: { name: string; pin: string }): string {
  return brandEmail({
    title: "Confirma tu correo",
    preheader: `Tu código es ${pin} y vence en 10 minutos.`,
    intro: `Hola ${name}, ya casi tienes tu cuenta lista. Usa el código de abajo para confirmar que este correo es tuyo.`,
    bodyHtml: `
              <ol style="margin:0 0 20px;padding-left:20px;color:${BRAND.textoSuave};">
                <li style="margin:0 0 6px;">Abre la página de verificación en ${escHtml(SITE.nombre)}.</li>
                <li style="margin:0 0 6px;">Escribe el código de 6 dígitos que aparece aquí abajo.</li>
                <li style="margin:0;">Listo: podrás entrar, comprar y seguir tus pedidos.</li>
              </ol>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
                <tr>
                  <td align="center" bgcolor="#f1f7fb" style="background:#f1f7fb;border:1px solid #cfe3ef;border-radius:10px;padding:20px 12px;">
                    <div class="pin" style="font-family:${BRAND.mono};font-size:38px;line-height:1.2;letter-spacing:12px;font-weight:700;color:${BRAND.azul};">${escHtml(pin)}</div>
                    <div style="margin-top:8px;font-family:${BRAND.fuente};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${BRAND.turquesa};">Vence en 10 minutos</div>
                  </td>
                </tr>
              </table>
              <p style="margin:0 0 14px;color:${BRAND.textoSuave};">El código es de un solo uso. Si no creaste esta cuenta, ignora este mensaje: nadie podrá activarla sin el código.</p>
              <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0;">
                <tr>
                  <td style="background:#fff7ed;border-left:4px solid #f59e0b;border-radius:6px;padding:12px 14px;font-family:${BRAND.fuente};font-size:13px;line-height:1.55;color:#7c4a03;">
                    <strong>No compartas este código.</strong> ${escHtml(SITE.nombre)} nunca te lo pedirá por WhatsApp, llamada ni mensaje directo.
                  </td>
                </tr>
              </table>`,
  });
}

/** Bienvenida tras crear la cuenta. */
export function welcomeEmail({ name, email }: { name: string; email: string }): string {
  const items: [string, string][] = [
    ["Verifica tu correo", "Confirma tu dirección para activar la cuenta y recibir avisos de tus pedidos."],
    ["Haz tus pedidos", "Compra en línea y sigue el estado de cada pedido desde tu cuenta."],
    ["Tu garaje", "Guarda tus vehículos para encontrar piezas compatibles sin buscar modelo por modelo."],
    ["Lista de deseos", "Marca lo que te interesa y vuelve cuando quieras."],
    ["Garantía y postventa", "Tus compras quedan registradas para gestionar garantías y respuestas técnicas."],
  ];
  return brandEmail({
    title: "Bienvenido a Impacto Automotriz",
    preheader: "Tu cuenta está creada. Te contamos por dónde empezar.",
    intro: `Hola ${name}, gracias por registrarte con ${email}. Tu cuenta ya existe y estas son las herramientas que tienes a mano.`,
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
              <p style="margin:16px 0 0;color:${BRAND.textoSuave};">Si no reconoces este registro, escríbenos a <a href="mailto:${escHtml(SITE.email)}" style="color:${BRAND.turquesa};">${escHtml(SITE.email)}</a>.</p>`,
    cta: { label: "Ir a mi cuenta", href: `${baseUrl()}/cuenta` },
  });
}

export type OrderConfirmationItem = { name: string; qty: number; price?: string };

/** Confirmación de pedido. La llamada desde el checkout queda fuera de este cambio. */
export function orderConfirmationEmail({
  name,
  orderNumber,
  total,
  items,
  trackingUrl,
  deliveryPin,
}: {
  name: string;
  orderNumber: number | string;
  total?: string;
  items?: OrderConfirmationItem[];
  trackingUrl?: string;
  deliveryPin?: string;
}): string {
  const filas = (items ?? [])
    .map(
      (i) => `                <tr>
                  <td style="padding:8px 0;border-bottom:1px solid ${BRAND.borde};font-family:${BRAND.fuente};font-size:14px;color:${BRAND.texto};">${escHtml(i.name)}</td>
                  <td align="center" style="padding:8px 0;border-bottom:1px solid ${BRAND.borde};font-family:${BRAND.fuente};font-size:14px;color:${BRAND.textoSuave};white-space:nowrap;">x${i.qty}</td>
                  <td align="right" style="padding:8px 0;border-bottom:1px solid ${BRAND.borde};font-family:${BRAND.fuente};font-size:14px;color:${BRAND.texto};white-space:nowrap;">${escHtml(i.price ?? "")}</td>
                </tr>`,
    )
    .join("\n");

  return brandEmail({
    title: `Recibimos tu pedido #${orderNumber}`,
    preheader: total ? `Pedido #${orderNumber} por ${total}.` : `Pedido #${orderNumber} recibido.`,
    intro: `Hola ${name}, ya tenemos tu pedido y estamos preparando la confirmación de disponibilidad.`,
    bodyHtml: `
              ${
                filas
                  ? `<table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 16px;">
                <tr>
                  <td style="padding:0 0 6px;font-family:${BRAND.fuente};font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">Producto</td>
                  <td align="center" style="padding:0 0 6px;font-family:${BRAND.fuente};font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">Cant.</td>
                  <td align="right" style="padding:0 0 6px;font-family:${BRAND.fuente};font-size:12px;font-weight:700;letter-spacing:.05em;text-transform:uppercase;color:#94a3b8;">Importe</td>
                </tr>
${filas}
              </table>`
                  : ""
              }
              ${
                total
                  ? `<p style="margin:0 0 16px;font-family:${BRAND.fuente};font-size:16px;font-weight:700;color:${BRAND.azul};">Total: ${escHtml(total)}</p>`
                  : ""
              }
              ${
                deliveryPin
                  ? `<p style="margin:0 0 16px;color:${BRAND.textoSuave};">PIN de entrega: <strong style="font-family:${BRAND.mono};font-size:18px;letter-spacing:3px;color:${BRAND.azul};">${escHtml(deliveryPin)}</strong>. Dáselo a quien entrega para confirmar la recepción.</p>`
                  : ""
              }
              <p style="margin:0;color:${BRAND.textoSuave};">Te avisaremos por correo cuando cambie el estado. Si tienes dudas, responde a este mensaje.</p>`,
    cta: { label: "Ver mi pedido", href: trackingUrl ?? `${baseUrl()}/cuenta` },
  });
}
