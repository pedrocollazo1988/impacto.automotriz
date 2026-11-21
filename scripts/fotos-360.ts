// Convierte las tomas de un plato giratorio en la secuencia que ya lee el visor
// (public/products/360/<sku>-NN.webp).
//
//   npx tsx scripts/fotos-360.ts TE-4001 ~/tomas/triciclo
//   npx tsx scripts/fotos-360.ts TE-4001 ~/tomas/triciclo --margen 0.1 --lado 900
//
// Acepta JPG, PNG, WebP y HEIC del movil. El orden es el de los nombres, con
// "foto2" antes que "foto10". Todas las tomas se recortan con la MISMA ventana
// (la que abarca el producto en su posicion mas extrema) para que el giro no
// baile; ver src/lib/encuadre.ts.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import { cajaComun, cajaObjeto, centro, ordenNatural, type Caja } from "../src/lib/encuadre";

const EXT = new Set([".jpg", ".jpeg", ".png", ".webp", ".heic", ".heif", ".avif", ".tif", ".tiff"]);
const MIN_FOTOS = 8;
const MAX_FOTOS = 72;
const ANALISIS = 420;

function uso(): never {
  console.error("Uso: npx tsx scripts/fotos-360.ts <sku> <carpeta> [--margen 0.12] [--lado 900] [--calidad 82] [--seco]");
  process.exit(1);
}

const args = process.argv.slice(2);
const opciones = new Map<string, string>();
const libres: string[] = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const nombre = args[i].slice(2);
    if (nombre === "seco") opciones.set("seco", "1");
    else opciones.set(nombre, args[++i] ?? "");
  } else libres.push(args[i]);
}

const [sku, carpeta] = libres;
if (!sku || !carpeta) uso();

const margen = Number(opciones.get("margen") ?? 0.12);
const lado = Number(opciones.get("lado") ?? 900);
const calidad = Number(opciones.get("calidad") ?? 82);
const seco = opciones.has("seco");

const destino = path.join(process.cwd(), "public", "products", "360");
const skuMin = sku.toLowerCase();

async function main() {
  if (!fs.existsSync(carpeta)) {
    console.error(`No existe la carpeta ${carpeta}`);
    process.exit(1);
  }

  const ficheros = fs
    .readdirSync(carpeta)
    .filter((f) => EXT.has(path.extname(f).toLowerCase()))
    .sort(ordenNatural);

  if (ficheros.length < MIN_FOTOS) {
    console.error(`Hay ${ficheros.length} fotos: el visor necesita al menos ${MIN_FOTOS} para girar.`);
    process.exit(1);
  }
  if (ficheros.length > MAX_FOTOS) {
    console.error(`Hay ${ficheros.length} fotos: el visor solo admite ${MAX_FOTOS}.`);
    process.exit(1);
  }

  const cajas: Caja[] = [];
  const avisos: string[] = [];
  let lienzo = { w: ANALISIS, h: ANALISIS };

  for (const f of ficheros) {
    const { data, info } = await sharp(path.join(carpeta, f))
      .rotate() // respeta la orientacion EXIF del movil
      .resize(ANALISIS, ANALISIS, { fit: "inside" })
      .removeAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    lienzo = { w: info.width, h: info.height };
    const caja = cajaObjeto(data, info.width, info.height, info.channels);
    if (!caja) {
      avisos.push(`${f}: no se distingue el producto del fondo; se encuadra como el resto.`);
      cajas.push({ x0: 0, y0: 0, x1: 0, y1: 0 });
    } else {
      cajas.push(caja);
    }
  }

  const conCaja = cajas.filter((c) => c.x1 > c.x0);
  const comun = cajaComun(conCaja, lienzo.w, lienzo.h, margen);

  // Un salto grande de centro entre tomas seguidas delata una foto fuera de sitio.
  const centros = conCaja.map(centro);
  let saltoMax = 0;
  for (let i = 1; i < centros.length; i++) {
    const dx = Math.abs(centros[i].x - centros[i - 1].x);
    const dy = Math.abs(centros[i].y - centros[i - 1].y);
    saltoMax = Math.max(saltoMax, Math.hypot(dx, dy));
  }
  const areas = centros.map((c) => Math.sqrt(c.area));
  const areaMin = Math.min(...areas);
  const areaMax = Math.max(...areas);

  console.log(`SKU ${skuMin}: ${ficheros.length} fotos`);
  console.log(
    `Ventana comun: ${Math.round(comun.x1 - comun.x0)}x${Math.round(comun.y1 - comun.y0)} px ` +
      `sobre un lienzo de ${lienzo.w}x${lienzo.h}`,
  );
  console.log(
    `Tamano del producto: ${(areaMin * 100).toFixed(1)} % a ${(areaMax * 100).toFixed(1)} % del lienzo`,
  );
  console.log(`Salto maximo entre tomas seguidas: ${(saltoMax * 100).toFixed(1)} % del lienzo`);

  if (saltoMax > 0.18) avisos.push("Un salto de mas del 18 % sugiere una foto descolocada o un giro desigual.");
  if (areaMin > 0 && areaMax / areaMin > 1.45) {
    avisos.push("El producto cambia de tamano mas de un 45 % entre tomas: acerca o aleja igual en todas.");
  }
  for (const a of avisos) console.log(`  aviso: ${a}`);

  if (seco) {
    console.log("Modo seco: no se escribe nada.");
    return;
  }

  fs.mkdirSync(destino, { recursive: true });

  // Se borran las tomas anteriores de este SKU para no mezclar secuencias viejas
  // con nuevas: un giro con fotos de dos sesiones salta a mitad de vuelta.
  for (const f of fs.readdirSync(destino)) {
    if (f.startsWith(`${skuMin}-`) && f.endsWith(".webp")) fs.unlinkSync(path.join(destino, f));
  }

  // La ventana viene en pixeles del lienzo de analisis. Se reescala la toma
  // entera por el mismo factor en los dos ejes, asi la ventana cae cuadrada y en
  // su sitio; despues basta recortarla.
  const factor = lado / (comun.x1 - comun.x0);
  const ancho = Math.max(lado, Math.round(lienzo.w * factor));
  const alto = Math.max(lado, Math.round(lienzo.h * factor));
  const izq = Math.min(Math.round(comun.x0 * factor), ancho - lado);
  const arr = Math.min(Math.round(comun.y0 * factor), alto - lado);
  let total = 0;

  for (let i = 0; i < ficheros.length; i++) {
    // Un solo resize: encadenar dos en sharp deja mandar solo al ultimo.
    const salida = await sharp(path.join(carpeta, ficheros[i]))
      .rotate()
      .resize(ancho, alto, { fit: "fill" })
      .extract({ left: izq, top: arr, width: lado, height: lado })
      .webp({ quality: calidad, effort: 5 })
      .toBuffer();

    fs.writeFileSync(path.join(destino, `${skuMin}-${String(i + 1).padStart(2, "0")}.webp`), salida);
    total += salida.length;
  }

  console.log(
    `${ficheros.length} fotogramas escritos en public/products/360/ (${(total / 1024).toFixed(0)} KB en total)`,
  );
}

main().catch((e) => {
  console.error(e instanceof Error ? e.message : e);
  process.exit(1);
});
