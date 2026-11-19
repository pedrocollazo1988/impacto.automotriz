// Genera los modelos .glb esquemáticos de todo el catálogo.
// Ejecutar: npx tsx scripts/generate-models.ts
import fs from "node:fs/promises";
import path from "node:path";
import { buildModelGLB } from "../src/lib/glb";
import { formaDe } from "../src/lib/shapes";

const OUT = path.join(process.cwd(), "public", "models");
const MANIFIESTO = path.join(process.cwd(), "src", "lib", "model-slugs.ts");

// SKU y nombre de cada producto del catálogo demo (mantener alineado con prisma/seed.ts).
const CATALOGO: [string, string][] = [
  ["AC-9001", "Alfombrillas de goma (juego)"],
  ["AC-9002", "Soporte de teléfono para auto"],
  ["AC-9003", "Cargador USB doble 12V"],
  ["CA-8001", "Espejo retrovisor eléctrico"],
  ["CA-8002", "Parachoques delantero"],
  ["EL-3001", "Batería 12V 60Ah"],
  ["EL-3002", "Alternador 12V 70A"],
  ["EL-3003", "Motor de arranque"],
  ["EL-3004", "Bujías de iridio (juego 4)"],
  ["FI-6001", "Filtro de aceite"],
  ["FI-6002", "Filtro de aire"],
  ["FI-6003", "Filtro de combustible"],
  ["FR-1001", "Pastillas de freno delanteras"],
  ["FR-1002", "Discos de freno ventilados"],
  ["FR-1003", "Líquido de frenos DOT-4"],
  ["LU-7001", "Faro LED delantero"],
  ["LU-7002", "Kit de bombillas H4"],
  ["MO-5001", "Motor 1.6 16V completo"],
  ["MO-5002", "Kit de distribución"],
  ["MO-5003", "Bomba de agua"],
  ["SU-2001", "Amortiguador trasero"],
  ["SU-2002", "Amortiguadores delanteros (par)"],
  ["SU-2003", "Rótulas de dirección"],
  ["TE-4001", "Triciclo eléctrico de carga"],
  ["TE-4002", "Bicicleta eléctrica plegable"],
  ["TE-4003", "Patinete eléctrico urbano"],
  ["KVI-CAR-01", "Tolva de carga con volteo"],
  ["KVI-CAR-02", "Asientos plegables y escalera trasera"],
  ["KVI-CAR-03", "Parabrisas y techo de cabina"],
  ["KVI-ELE-01", "Controlador 72V 24Q60A"],
  ["KVI-ELE-02", "Banco de 6 baterías 12V 58Ah"],
  ["KVI-ELE-03", "Cargador inteligente 72V 7A"],
  ["KVI-ELE-04", "Convertidor DC-DC 72V a 12V"],
  ["KVI-ELE-05", "Extensor de rango a gasolina"],
  ["KVI-FRE-01", "Zapatas y bandas de freno de tambor"],
  ["KVI-FRE-02", "Pedal y varilla de freno"],
  ["KVI-FRE-03", "Freno de estacionamiento"],
  ["KVI-MAN-01", "Puño acelerador con reversa"],
  ["KVI-MAN-02", "Display digital LCD"],
  ["KVI-MAN-03", "Switch de encendido con 2 llaves"],
  ["KVI-MOT-01", "Motor eléctrico sin escobillas 72V 1200W"],
  ["KVI-MOT-02", "Eje trasero con diferencial"],
  ["KVI-MOT-03", "Selector de fuerza alta/baja"],
  ["KVI-RUE-01", "Neumático 12 reforzado"],
  ["KVI-RUE-02", "Cámara de aire 12"],
  ["KVI-RUE-03", "Rin metálico 12"],
  ["KVI-SUS-01", "Barras telescópicas delanteras"],
  ["KVI-SUS-02", "Juego de ballestas traseras"],
  ["KVI-SUS-03", "Amortiguadores traseros de apoyo"],
];

async function main() {
  await fs.mkdir(OUT, { recursive: true });
  const previos = (await fs.readdir(OUT)).filter((f) => f.endsWith(".glb"));
  await Promise.all(previos.map((f) => fs.unlink(path.join(OUT, f))));

  let n = 0;
  const slugs: string[] = [];
  for (const [sku, nombre] of CATALOGO) {
    const glb = buildModelGLB({ piezas: formaDe(sku, nombre), nombre });
    const slug = sku.toLowerCase();
    await fs.writeFile(path.join(OUT, `${slug}.glb`), glb);
    slugs.push(slug);
    n++;
  }
  // El visor solo debe pedir modelos que existan; esta lista la consume urlModelo().
  await fs.writeFile(MANIFIESTO, `// Generado por scripts/generate-models.ts. No editar a mano.\nexport const SLUGS_MODELO: ReadonlySet<string> = new Set(${JSON.stringify(slugs.sort(), null, 2)});\n`);
  console.log(`Modelos 3D generados: ${n} en public/models/`);
}

main();
