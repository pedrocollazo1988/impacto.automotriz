import crypto from "node:crypto";

// Módulo de servidor: usa node:crypto y APP_SECRET. No lo importes desde un
// componente cliente (el componente solo habla con /api/captcha).
//
// El token es opaco: base64url(payload ‖ firma HMAC-SHA256), un solo bloque sin
// separadores. El payload lleva solo el timestamp, un nonce y el hash HMAC de la
// respuesta, nunca la respuesta. Los glifos del SVG se dibujan como vectores
// (nunca como <text>) para que el propio SVG tampoco exponga el código.

const ALFABETO = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // sin 0/O/1/I
const LARGO = 4;
const TTL_MS = 10 * 60_000;
const VERSION = 1;
const FIRMA_BYTES = 32; // SHA-256
const B64URL = /^[A-Za-z0-9_-]+$/;

type Payload = { v: number; iat: number; exp: number; n: string; h: string };

function secreto(): string {
  const s = process.env.APP_SECRET;
  if (!s) throw new Error("Falta APP_SECRET: el captcha no puede firmar ni verificar retos sin ella.");
  return s;
}

const hmac = (data: crypto.BinaryLike) => crypto.createHmac("sha256", secreto()).update(data).digest();
const normalizar = (s: string) => s.replace(/[^a-z0-9]/gi, "").toUpperCase();
const hashRespuesta = (nonce: string, answer: string) => hmac(`captcha:answer:${nonce}:${normalizar(answer)}`).toString("hex");

// ───────── Glifos 5×7 ─────────
// Cada fila es una cadena de 5 posiciones; 1 = celda encendida. Al pintarlas
// como pequeños cuadrados vectoriales el SVG no contiene el texto del código.
const GLIFOS: Record<string, readonly string[]> = {
  A: ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
  B: ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
  C: ["01110", "10001", "10000", "10000", "10000", "10001", "01110"],
  D: ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
  E: ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
  F: ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
  G: ["01110", "10001", "10000", "10111", "10001", "10001", "01111"],
  H: ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
  J: ["00111", "00010", "00010", "00010", "00010", "10010", "01100"],
  K: ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
  L: ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
  M: ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
  N: ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
  P: ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
  Q: ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
  R: ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
  S: ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
  T: ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
  U: ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
  V: ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
  W: ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
  X: ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
  Y: ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
  Z: ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
  "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
  "3": ["01110", "10001", "00001", "00110", "00001", "10001", "01110"],
  "4": ["00010", "00110", "01010", "10010", "11111", "00010", "00010"],
  "5": ["11111", "10000", "11110", "00001", "00001", "10001", "01110"],
  "6": ["00110", "01000", "10000", "11110", "10001", "10001", "01110"],
  "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
  "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
  "9": ["01110", "10001", "10001", "01111", "00001", "00010", "01100"],
};

const CELDA = 4;
const PUNTO = 3.2;

function caminoGlifo(filas: readonly string[]): string {
  let d = "";
  const margen = (CELDA - PUNTO) / 2;
  for (let y = 0; y < filas.length; y++) {
    const fila = filas[y];
    for (let x = 0; x < fila.length; x++) {
      if (fila[x] === "1") d += `M${x * CELDA + margen} ${y * CELDA + margen}h${PUNTO}v${PUNTO}h-${PUNTO}z`;
    }
  }
  return d;
}

const CAMINOS: Record<string, string> = Object.fromEntries(
  Object.entries(GLIFOS).map(([letra, filas]) => [letra, caminoGlifo(filas)]),
);

const azar = (min: number, max: number) => min + (crypto.randomInt(0, 1000) / 1000) * (max - min);
const elegir = <T,>(xs: readonly T[]): T => xs[crypto.randomInt(0, xs.length)];

function generarCodigo(): string {
  return Array.from({ length: LARGO }, () => ALFABETO[crypto.randomInt(0, ALFABETO.length)]).join("");
}

function dibujarSvg(answer: string, nonce: string): string {
  const ancho = 180;
  const alto = 64;
  const tintas = ["#0f172a", "#12283f", "#1f2937", "#0b3b5c"];
  const ruido: string[] = [];

  for (let i = 0; i < 46; i++) {
    ruido.push(
      `<circle cx="${azar(4, ancho - 4).toFixed(1)}" cy="${azar(4, alto - 4).toFixed(1)}" r="${azar(0.6, 1.7).toFixed(1)}" fill="${elegir(tintas)}" opacity="${azar(0.12, 0.32).toFixed(2)}"/>`,
    );
  }
  for (let i = 0; i < 4; i++) {
    ruido.push(
      `<line x1="${azar(0, ancho).toFixed(1)}" y1="${azar(0, alto).toFixed(1)}" x2="${azar(0, ancho).toFixed(1)}" y2="${azar(0, alto).toFixed(1)}" stroke="${elegir(tintas)}" stroke-width="${azar(0.8, 1.6).toFixed(1)}" opacity="${azar(0.18, 0.35).toFixed(2)}"/>`,
    );
  }
  for (let i = 0; i < 2; i++) {
    ruido.push(
      `<path d="M${azar(0, ancho).toFixed(1)} ${azar(0, alto).toFixed(1)}Q${azar(0, ancho).toFixed(1)} ${azar(0, alto).toFixed(1)} ${azar(0, ancho).toFixed(1)} ${azar(0, alto).toFixed(1)}" fill="none" stroke="${elegir(tintas)}" stroke-width="${azar(0.7, 1.3).toFixed(1)}" opacity="${azar(0.15, 0.3).toFixed(2)}"/>`,
    );
  }

  const inicio = 18;
  const paso = 40;
  const glifos = [...answer]
    .map((caracter, i) => {
      const x = (inicio + i * paso + azar(-2, 2)).toFixed(1);
      const y = (18 + azar(-2, 2)).toFixed(1);
      const giro = azar(-16, 16).toFixed(1);
      return `<g transform="translate(${x} ${y}) rotate(${giro} 10 14)" fill="${elegir(tintas)}"><path d="${CAMINOS[caracter]}"/></g>`;
    })
    .join("");

  // Un par de trazos por delante del código, siempre tenues, para que el ruido
  // no impida leerlo.
  const encima = Array.from({ length: 2 }, () =>
    `<line x1="${azar(0, ancho).toFixed(1)}" y1="${azar(0, alto).toFixed(1)}" x2="${azar(0, ancho).toFixed(1)}" y2="${azar(0, alto).toFixed(1)}" stroke="${elegir(tintas)}" stroke-width="${azar(0.6, 1).toFixed(1)}" opacity="${azar(0.1, 0.18).toFixed(2)}"/>`,
  ).join("");

  return (
    `<svg xmlns="http://www.w3.org/2000/svg" width="${ancho}" height="${alto}" viewBox="0 0 ${ancho} ${alto}" role="img" aria-labelledby="captcha-t-${nonce}">` +
    `<title id="captcha-t-${nonce}">Código de verificación de cuatro caracteres</title>` +
    `<rect width="${ancho}" height="${alto}" fill="#ffffff"/>` +
    ruido.join("") +
    glifos +
    encima +
    `</svg>`
  );
}

export function createCaptcha(): { token: string; svg: string } {
  secreto(); // falla de inmediato y con un mensaje claro si no hay APP_SECRET
  const answer = generarCodigo();
  const nonce = crypto.randomBytes(12).toString("hex");
  const iat = Date.now();
  const payload: Payload = { v: VERSION, iat, exp: iat + TTL_MS, n: nonce, h: hashRespuesta(nonce, answer) };
  const cuerpo = Buffer.from(JSON.stringify(payload), "utf8");
  const token = Buffer.concat([cuerpo, hmac(cuerpo)]).toString("base64url");
  return { token, svg: dibujarSvg(answer, nonce) };
}

export function verifyCaptcha(token: string, answer: string): boolean {
  if (typeof token !== "string" || typeof answer !== "string") return false;
  if (token.length === 0 || token.length > 4096 || answer.length > 64 || !B64URL.test(token)) return false;
  secreto(); // sin APP_SECRET no se puede verificar nada: error de configuración

  const bruto = Buffer.from(token, "base64url");
  // Rechaza codificaciones no canónicas para que el token no se pueda mutar.
  if (bruto.length <= FIRMA_BYTES || bruto.toString("base64url") !== token) return false;
  const cuerpo = bruto.subarray(0, bruto.length - FIRMA_BYTES);
  const firma = bruto.subarray(bruto.length - FIRMA_BYTES);

  const esperada = hmac(cuerpo);
  if (firma.length !== esperada.length || !crypto.timingSafeEqual(firma, esperada)) return false;

  let payload: Payload;
  try {
    payload = JSON.parse(cuerpo.toString("utf8")) as Payload;
  } catch {
    return false;
  }
  if (
    !payload ||
    payload.v !== VERSION ||
    !Number.isFinite(payload.iat) ||
    !Number.isFinite(payload.exp) ||
    typeof payload.n !== "string" ||
    payload.n.length < 16 ||
    typeof payload.h !== "string" ||
    !/^[0-9a-f]{64}$/.test(payload.h)
  ) {
    return false;
  }
  if (payload.exp < Date.now()) return false;

  const calculado = Buffer.from(hashRespuesta(payload.n, answer), "hex");
  const guardado = Buffer.from(payload.h, "hex");
  return guardado.length === calculado.length && crypto.timingSafeEqual(guardado, calculado);
}
