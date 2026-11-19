// Semilla del despiece interactivo. Ejecutar: npx tsx prisma/seed-despiece.ts
// Idempotente: se puede correr varias veces sin duplicar nada.
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const SYSTEMS = [
  { slug: "propulsion", name: "Propulsión", icon: "bolt", blurb: "Motor, diferencial, selector de fuerza y eje trasero.", sortOrder: 1 },
  { slug: "electronica", name: "Electrónica", icon: "battery", blurb: "Controlador, banco de baterías, cargador y convertidor.", sortOrder: 2 },
  { slug: "ruedas", name: "Transmisión y ruedas", icon: "gauge", blurb: "Neumáticos, cámaras, rines, radios y bujes.", sortOrder: 3 },
  { slug: "suspension", name: "Suspensión", icon: "layers", blurb: "Horquilla, ballestas y amortiguadores de carga.", sortOrder: 4 },
  { slug: "frenos", name: "Frenos", icon: "shield", blurb: "Tambor, zapatas, varilla y freno de estacionamiento.", sortOrder: 5 },
  { slug: "carroceria", name: "Chasis y carrocería", icon: "truck", blurb: "Tolva de volteo, asientos, escalera y cabina.", sortOrder: 6 },
  { slug: "mandos", name: "Mandos y control", icon: "gauge", blurb: "Acelerador, display, encendido e interruptores.", sortOrder: 7 },
];

type Part = {
  sku: string; name: string; system: string; priceUsd: number; stock: number;
  specs: Record<string, string>; description: string;
  number: number; x: number; y: number; svgId: string; label: string;
  packQty?: number; variants?: { sku: string; name: string; priceUsd?: number; stock: number }[];
};

// Coordenadas en porcentaje sobre la lámina de cada sistema (1200×800).
const PARTS: Part[] = [
  // ── Propulsión ──
  {
    sku: "KVI-MOT-01", name: "Motor eléctrico sin escobillas 72V 1200W", system: "propulsion", priceUsd: 385, stock: 6,
    specs: { Voltaje: "72 V", Potencia: "1200 W", Tipo: "Brushless · acople directo al diferencial", Conector: "3 fases + 5 Hall (Julet)", Grados: "IP54" },
    description: "Motor de cubo para triciclo de carga Kvitova DDS-OD. Acopla directamente al diferencial trasero, sin cadena. Incluye sensor Hall de 5 hilos y conector Julet estanco. Revisa la foto de conectores antes de comprar: las versiones híbridas usan un arnés distinto.",
    number: 1, x: 22.25, y: 60.94, svgId: "parte-01", label: "Motor 72V 1200W",
  },
  {
    sku: "KVI-MOT-02", name: "Eje trasero con diferencial y reductora", system: "propulsion", priceUsd: 295, stock: 4,
    specs: { Material: "Acero forjado", Relación: "Reductora de doble fuerza", Ancho: "980 mm entre bujes", Birlos: "4/5 por rueda" },
    description: "Conjunto de eje trasero con caja reductora de doble fuerza para carga pesada. Es la pieza que diferencia al Kvitova de un triciclo ligero: permite subir carga en pendiente usando la relación baja.",
    number: 2, x: 48.33, y: 61.19, svgId: "parte-02", label: "Eje con diferencial",
  },
  {
    sku: "KVI-MOT-03", name: "Selector de fuerza alta/baja con guaya", system: "propulsion", priceUsd: 38, stock: 12,
    specs: { Accionamiento: "Guaya mecánica", Posiciones: "2 (alta / baja)", Largo: "1.6 m", Compatible: "DDS-OD 2023 en adelante" },
    description: "Palanca y mecanismo de cambio de relación alta/baja. Incluye guaya y tensor. Si la palanca no queda fija en una posición, el trinquete interno está gastado: sustituir el conjunto completo.",
    number: 3, x: 40.72, y: 37.31, svgId: "parte-03", label: "Selector de fuerza",
  },
  {
    sku: "KVI-MOT-04", name: "Eje trasero (barra y bujes)", system: "propulsion", priceUsd: 96, stock: 8,
    specs: { Diámetro: "40 mm", Largo: "1 020 mm", Material: "Acero 1045", Acabado: "Cincado" },
    description: "Barra de eje de repuesto y juego de bujes. Se sustituye cuando hay holgura vertical en las ruedas traseras o ruido metálico en curva.",
    number: 4, x: 73.1, y: 59.1, svgId: "parte-04", label: "Eje trasero",
  },

  // ── Electrónica ──
  {
    sku: "KVI-ELE-01", name: "Controlador 72V24Q60A (24 MOSFET)", system: "electronica", priceUsd: 178, stock: 5,
    specs: { Voltaje: "72 V", Corriente: "60 A", MOSFET: "24", Ramales: "Hall, marcha atrás, corte de freno, velocímetro", Conector: "Plástico 6 pines + Faston" },
    description: "Centralita original 72V24Q60A. Es la pieza con más variantes del triciclo: hay versiones con conector de 6 pines y otras con arnés soldado. La ficha incluye foto en primer plano de cada ramal con el color de cable para que confirmes el tuyo antes de pedir.",
    number: 1, x: 23.17, y: 49.56, svgId: "parte-01", label: "Controlador",
  },
  {
    sku: "KVI-ELE-02", name: "Banco de 6 baterías 12V 58Ah (kit 72V)", system: "electronica", priceUsd: 720, stock: 3, packQty: 6,
    specs: { Voltaje: "72 V en serie", Capacidad: "58 Ah", Química: "Gel / plomo-ácido", Unidades: "6 × 12 V", Medidas: "230 × 138 × 227 mm (c/u)" },
    description: "Juego completo de 6 baterías de gel 12V 58Ah conectadas en serie para 72V. Incluye puentes de unión y terminales. Se vende también por unidad para reparaciones puntuales.",
    number: 2, x: 67, y: 48.81, svgId: "parte-02", label: "Banco 6×12V 58Ah",
    variants: [
      { sku: "KVI-ELE-02-K6", name: "Kit completo (6 unidades)", priceUsd: 720, stock: 3 },
      { sku: "KVI-ELE-02-U1", name: "Una unidad 12V 58Ah", priceUsd: 128, stock: 14 },
    ],
  },
  {
    sku: "KVI-ELE-03", name: "Cargador inteligente 72V 7A", system: "electronica", priceUsd: 86, stock: 9,
    specs: { Salida: "72 V · 7 A", Entrada: "110 V", Conector: "3 pines (macho)", Protección: "Corte automático al 100 %" },
    description: "Cargador de 72V 7A con corte automático. Enchufe de 3 pines. Cargar un banco de 58Ah desde vacío toma entre 8 y 9 horas; si tarda mucho más, revisa la resistencia interna del banco.",
    number: 3, x: 20, y: 78.94, svgId: "parte-03", label: "Cargador 72V 7A",
  },
  {
    sku: "KVI-ELE-04", name: "Convertidor DC-DC 72V a 12V", system: "electronica", priceUsd: 42, stock: 11,
    specs: { Entrada: "72 V", Salida: "12 V · 10 A", Uso: "Luces, bocina, display", Montaje: "2 tornillos" },
    description: "Reductor que alimenta luces, bocina y accesorios de 12V desde el banco de 72V. Si se funden las bombillas con frecuencia, este convertidor está entregando sobretensión.",
    number: 4, x: 41.17, y: 77.38, svgId: "parte-04", label: "Convertidor 72→12V",
  },
  {
    sku: "KVI-ELE-05", name: "Extensor de rango a gasolina (versión híbrida)", system: "electronica", priceUsd: 640, stock: 2,
    specs: { Potencia: "5000–5500 W", Combustible: "Gasolina", Arranque: "Automático", Compatible: "Solo versiones híbridas DDS-OD" },
    description: "Generador auxiliar para las unidades híbridas. No es compatible con la versión eléctrica pura: el arnés y el anclaje del chasis son distintos. Las piezas propias del generador (bujía, carburador, filtro de aire) se venden por separado.",
    number: 5, x: 84.17, y: 77, svgId: "parte-05", label: "Extensor de rango",
  },

  // ── Ruedas ──
  {
    sku: "KVI-RUE-01", name: "Neumático 12\" reforzado", system: "ruedas", priceUsd: 68, stock: 16,
    specs: { Medida: "3.75-12 ó 4.50-12", Aro: "12 pulgadas", Uso: "Carga pesada", Lonas: "8 PR (reforzada)" },
    description: "Cubierta de uso pesado con lona reforzada. Convive en el mercado con dos anchos: 3.75-12 y 4.50-12, más habitual el ancho en el eje trasero. Elige la medida exacta de tu unidad; no son intercambiables sobre el mismo rin.",
    number: 1, x: 20.83, y: 50.5, svgId: "parte-01", label: "Neumático 12\"",
    variants: [
      { sku: "KVI-RUE-01-A", name: "3.75-12", priceUsd: 62, stock: 9 },
      { sku: "KVI-RUE-01-B", name: "4.50-12 (reforzado)", priceUsd: 68, stock: 7 },
    ],
  },
  {
    sku: "KVI-RUE-02", name: "Cámara de aire 12\" válvula reforzada", system: "ruedas", priceUsd: 14, stock: 40,
    specs: { Medida: "3.75/4.50-12", Válvula: "Reforzada, recta", Material: "Butilo" },
    description: "Cámara de butilo con válvula reforzada. Sirve para ambos anchos de cubierta. Cambia también la cubierta si el pinchazo se repite en el mismo punto.",
    number: 2, x: 45, y: 49.19, svgId: "parte-02", label: "Cámara de aire",
  },
  {
    sku: "KVI-RUE-03", name: "Rin metálico 12\" (aro de acero)", system: "ruedas", priceUsd: 54, stock: 12,
    specs: { Aro: "12 pulgadas", Material: "Acero", Birlos: "Delantero 4 · trasero 5", Acabado: "Pintado negro" },
    description: "Llanta de acero de 12 pulgadas. El delantero y los traseros no son iguales: cambia el número de birlos. Indica la posición al pedir.",
    number: 3, x: 68.33, y: 52.44, svgId: "parte-03", label: "Rin 12\"",
  },
  {
    sku: "KVI-RUE-04", name: "Juego de radios y niples", system: "ruedas", priceUsd: 19, stock: 20,
    specs: { Unidades: "36 radios + 36 niples", Largo: "185 mm", Material: "Acero inoxidable" },
    description: "Juego completo de radios y niples para rin de 12\". Se recomienda sustituir el juego completo si hay más de tres radios flojos: el centrado vuelve a perderse.",
    number: 4, x: 20.83, y: 84.69, svgId: "parte-04", label: "Radios",
  },
  {
    sku: "KVI-RUE-05", name: "Kit de bujes y eje de rueda", system: "ruedas", priceUsd: 32, stock: 15,
    specs: { Birlos: "4/5", Rodamientos: "6204-2RS", Incluye: "Bujes, separadores y tuercas" },
    description: "Kit de bujes, rodamientos 6204 y separadores. Es el causante habitual del ruido en curva y de la holgura de la rueda.",
    number: 5, x: 58.33, y: 85.06, svgId: "parte-05", label: "Eje y bujes",
  },

  // ── Suspensión ──
  {
    sku: "KVI-SUS-01", name: "Barras telescópicas delanteras (horquilla)", system: "suspension", priceUsd: 145, stock: 6,
    specs: { Tipo: "Hidráulica reforzada", Cristos: "Doble", Recorrido: "120 mm", Tubo: "Ø 37 mm" },
    description: "Horquilla hidráulica de doble cristo para el tren delantero. Si el triciclo se hunde al frenar o pierde aceite por los retenes, el cartucho está vencido.",
    number: 1, x: 25.42, y: 46.44, svgId: "parte-01", label: "Barras telescópicas",
  },
  {
    sku: "KVI-SUS-02", name: "Juego de ballestas traseras 500–800 kg", system: "suspension", priceUsd: 210, stock: 5,
    specs: { Carga: "500–800 kg", Hojas: "4 por paquete", Unidades: "2 paquetes", Largo: "1 100 mm" },
    description: "Paquete de ballestas de acero para el eje trasero. Es lo que sostiene la carga: si el triciclo va vencido hacia un lado con la tolva llena, alguna hoja está partida.",
    number: 2, x: 53.33, y: 63.69, svgId: "parte-02", label: "Ballestas",
  },
  {
    sku: "KVI-SUS-03", name: "Amortiguadores traseros de apoyo", system: "suspension", priceUsd: 78, stock: 8,
    specs: { Tipo: "Resorte hidráulico", Unidades: "2", Largo: "340 mm", Anclaje: "Ojo-ojo" },
    description: "Par de amortiguadores hidráulicos que apoyan al paquete de ballestas. Se cambian en pareja para no descompensar el eje.",
    number: 3, x: 74.75, y: 49.38, svgId: "parte-03", label: "Amortiguadores",
  },

  // ── Frenos ──
  {
    sku: "KVI-FRE-01", name: "Zapatas y bandas de freno de tambor", system: "frenos", priceUsd: 46, stock: 14,
    specs: { Tipo: "Tambor mecánico", Posición: "Delantero y trasero", Unidades: "Juego por rueda", Medida: "Ø 180 mm" },
    description: "Juego de zapatas con banda para freno de tambor. Se sustituyen por eje completo: mezclar zapatas nuevas con viejas descompensa el frenado.",
    number: 1, x: 30, y: 56.06, svgId: "parte-01", label: "Zapatas",
  },
  {
    sku: "KVI-FRE-02", name: "Pedal y varilla de freno con sensor de corte", system: "frenos", priceUsd: 39, stock: 10,
    specs: { Accionamiento: "Varilla mecánica", Sensor: "Corte eléctrico al frenar", Incluye: "Pedal, varilla y muelle" },
    description: "Conjunto de pedal y varilla con interruptor de corte. Ese sensor avisa al controlador para cortar la tracción al frenar; si la moto 'empuja' al frenar, revisa este contacto.",
    number: 2, x: 61.75, y: 62.13, svgId: "parte-02", label: "Pedal y varilla",
  },
  {
    sku: "KVI-FRE-03", name: "Freno de estacionamiento (palanca de bloqueo)", system: "frenos", priceUsd: 27, stock: 13,
    specs: { Tipo: "Bloqueo manual", Montaje: "Manillar", Función: "Emergencia y aparcamiento" },
    description: "Palanca de bloqueo manual para dejar el triciclo frenado en pendiente con carga. No sustituye al freno de servicio.",
    number: 3, x: 55.31, y: 40.88, svgId: "parte-03", label: "Estacionamiento",
  },

  // ── Carrocería ──
  {
    sku: "KVI-CAR-01", name: "Tolva de carga 1600 × 1100 mm con volteo", system: "carroceria", priceUsd: 480, stock: 3,
    specs: { Medidas: "1600 × 1100 mm", Volteo: "Manual", Material: "Acero galvanizado", Carga: "Hasta 800 kg" },
    description: "Cama de carga con sistema de volteo manual. Se entrega desmontada; incluye bisagras, pasadores y tornillería. Es la pieza más voluminosa: consulta el coste de transporte antes de pedir.",
    number: 1, x: 50, y: 53.31, svgId: "parte-01", label: "Tolva de carga",
  },
  {
    sku: "KVI-CAR-02", name: "Asientos plegables y escalera trasera", system: "carroceria", priceUsd: 165, stock: 4,
    specs: { Plazas: "Hasta 8 pasajeros", Asientos: "Bancas plegables", Escalera: "Peldaño trasero de 2 hojas" },
    description: "Bancas interiores plegables y peldaño trasero. Es la configuración de pasajeros del DDS-OD; se monta y desmonta sin herramientas sobre los anclajes de la tolva.",
    number: 2, x: 66.47, y: 71.67, svgId: "parte-02", label: "Asientos y escalera",
  },
  {
    sku: "KVI-CAR-03", name: "Parabrisas y techo de cabina", system: "carroceria", priceUsd: 235, stock: 2,
    specs: { Incluye: "Parabrisas, techo y soportes", Material: "Acrílico + acero", Compatible: "Versiones con cubierta" },
    description: "Kit de cabina para las versiones con cubierta superior. El acrílico se raya con facilidad: limpia con agua y paño suave, nunca con estropajo.",
    number: 3, x: 33.33, y: 21.63, svgId: "parte-03", label: "Parabrisas y techo",
  },
  {
    sku: "KVI-CAR-04", name: "Chasis y bastidor principal", system: "carroceria", priceUsd: 690, stock: 1,
    specs: { Material: "Acero estructural", Perfil: "80 × 40 mm", Acabado: "Cincado + pintura", Unión: "Soldado" },
    description: "Bastidor principal del triciclo. Solo se recomienda su sustitución tras un accidente o corrosión estructural; requiere desmontaje completo del vehículo.",
    number: 4, x: 51.33, y: 77.21, svgId: "parte-04", label: "Chasis",
  },

  // ── Mandos ──
  {
    sku: "KVI-MAN-01", name: "Puño acelerador con reversa y 3 velocidades", system: "mandos", priceUsd: 34, stock: 18,
    specs: { Voltaje: "72 V", Funciones: "Reversa + 3 velocidades", Conector: "Julet 3 pines", Diámetro: "22 mm" },
    description: "Puño de aceleración con botón de marcha atrás y selector de tres velocidades. El conector Julet de 3 pines es el más habitual, pero existen unidades con 4 pines: compara la foto del conector.",
    number: 1, x: 22.92, y: 43.94, svgId: "parte-01", label: "Puño acelerador",
  },
  {
    sku: "KVI-MAN-02", name: "Display digital LCD (velocímetro y odómetro)", system: "mandos", priceUsd: 72, stock: 7,
    specs: { Voltaje: "72 V", Pantalla: "LCD", Muestra: "Velocidad, voltaje, odómetro", Conector: "5 pines" },
    description: "Pantalla LCD con velocímetro, nivel de voltaje del banco y odómetro. Si marca menos de 63V en reposo con carga completa, el problema es de baterías, no del display.",
    number: 2, x: 47.92, y: 42.69, svgId: "parte-02", label: "Display LCD",
  },
  {
    sku: "KVI-MAN-03", name: "Switch de encendido con 2 llaves", system: "mandos", priceUsd: 24, stock: 16,
    specs: { Llaves: "2", Posiciones: "Off / On", Bloqueo: "Manillar", Conector: "2 pines" },
    description: "Cilindro de encendido con dos llaves y bloqueo de manillar. Si el triciclo se apaga en baches, revisa el conector antes de cambiar el switch.",
    number: 3, x: 70, y: 40.81, svgId: "parte-03", label: "Encendido",
  },
  {
    sku: "KVI-MAN-04", name: "Manillar reforzado", system: "mandos", priceUsd: 58, stock: 6,
    specs: { Diámetro: "22 mm", Material: "Acero", Ancho: "680 mm", Acabado: "Cromado" },
    description: "Manillar de acero de 22 mm. Se dobla con facilidad tras una caída con carga; si la dirección tira hacia un lado, comprueba también la horquilla.",
    number: 4, x: 29.46, y: 58.66, svgId: "parte-04", label: "Manillar",
  },
  {
    sku: "KVI-MAN-05", name: "Juego de interruptores (luces, bocina, direccionales)", system: "mandos", priceUsd: 29, stock: 12,
    specs: { Funciones: "Luces, bocina, direccionales", Voltaje: "12 V", Conector: "Bloque 6 pines" },
    description: "Bloque de interruptores del manillar. Funciona a 12V a través del convertidor DC-DC: si solo falla un pulsador, se puede sustituir la membrana sin cambiar el bloque.",
    number: 5, x: 63.75, y: 62, svgId: "parte-05", label: "Interruptores",
  },
];

// Piezas que sirven para otros productos del catálogo (compatibilidad cruzada).
const CROSS: [string, string, string][] = [
  ["KVI-RUE-02", "KVI-RUE-01", "Misma cámara para ambos anchos de cubierta (3.75 y 4.50)"],
  ["KVI-ELE-03", "KVI-ELE-02", "Cargador original del banco de 6 unidades"],
  ["KVI-FRE-02", "KVI-ELE-01", "El sensor de corte de freno se conecta al ramal del controlador"],
  ["KVI-MAN-01", "KVI-ELE-01", "Conector Julet compatible con el arnés del controlador 72V24Q60A"],
];

const DIAGRAMS: [string, string, string, string][] = [
  ["propulsion", "Sistema de propulsión", "/despiece/propulsion.svg", "Motor, diferencial, selector de fuerza y eje."],
  ["electronica", "Sistema electrónico", "/despiece/electronica.svg", "Controlador, banco de baterías, cargador y convertidor."],
  ["ruedas", "Transmisión y ruedas", "/despiece/ruedas.svg", "Neumático, cámara, rin, radios y bujes."],
  ["suspension", "Suspensión", "/despiece/suspension.svg", "Horquilla, ballestas y amortiguadores."],
  ["frenos", "Sistema de frenos", "/despiece/frenos.svg", "Tambor, zapatas, varilla y estacionamiento."],
  ["carroceria", "Chasis y carrocería", "/despiece/carroceria.svg", "Tolva de volteo, asientos, cabina y chasis."],
  ["mandos", "Mandos y control", "/despiece/mandos.svg", "Acelerador, display, encendido e interruptores."],
];

const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);

async function main() {
  const systems: Record<string, number> = {};
  for (const s of SYSTEMS) {
    const row = await prisma.partSystem.upsert({ where: { slug: s.slug }, update: { name: s.name, icon: s.icon, blurb: s.blurb, sortOrder: s.sortOrder }, create: s });
    systems[s.slug] = row.id;
  }

  const vehicle = await prisma.vehicle.upsert({
    where: { slug: "kvitova-dds-od" },
    update: { brand: "Kvitova", model: "DDS-OD", version: "Eléctrico", voltage: "72 V", power: "1200 W", payload: "500–800 kg" },
    create: {
      slug: "kvitova-dds-od", brand: "Kvitova", model: "DDS-OD", version: "Eléctrico",
      year: 2025, voltage: "72 V", power: "1200 W", payload: "500–800 kg", sortOrder: 1,
      summary: "Triciclo eléctrico de carga con tolva de volteo de 1600 × 1100 mm, motor de 1200 W, banco de 72 V y caja reductora de doble fuerza. Se usa tanto para carga como, con las bancas plegables, para transporte de pasajeros.",
    },
  });

  // Categoría de repuestos: todo el despiece vive bajo una sola rama del catálogo.
  const category = await prisma.category.upsert({ where: { slug: "repuestos" }, update: {}, create: { slug: "repuestos", name: "Repuestos" } });
  const brand = await prisma.brand.upsert({ where: { slug: "kvitova" }, update: {}, create: { slug: "kvitova", name: "Kvitova" } });

  const productIds: Record<string, number> = {};
  for (const p of PARTS) {
    const slug = slugify(`${p.sku} ${p.name}`);
    const data = {
      slug, sku: p.sku, name: p.name, description: p.description, priceUsd: p.priceUsd,
      stock: p.stock, specs: p.specs, categoryId: category.id, brandId: brand.id,
      systemId: systems[p.system], packQty: p.packQty ?? null, active: true,
    };
    const row = await prisma.product.upsert({ where: { sku: p.sku }, update: data, create: data });
    productIds[p.sku] = row.id;
    if (p.variants?.length) {
      for (const v of p.variants) {
        await prisma.productVariant.upsert({
          where: { sku: v.sku },
          update: { productId: row.id, name: v.name, priceUsd: v.priceUsd ?? null, stock: v.stock, active: true },
          create: { productId: row.id, sku: v.sku, name: v.name, priceUsd: v.priceUsd ?? null, stock: v.stock },
        });
      }
    }
  }

  for (const [systemSlug, title, image, notes] of DIAGRAMS) {
    const diagram = await prisma.vehicleDiagram.upsert({
      where: { vehicleId_systemId: { vehicleId: vehicle.id, systemId: systems[systemSlug] } },
      update: { title, image, notes },
      create: { vehicleId: vehicle.id, systemId: systems[systemSlug], title, image, notes },
    });
    const pins = PARTS.filter((p) => p.system === systemSlug);
    for (const p of pins) {
      await prisma.diagramPin.upsert({
        where: { diagramId_number: { diagramId: diagram.id, number: p.number } },
        update: { productId: productIds[p.sku], x: p.x, y: p.y, svgId: p.svgId, label: p.label },
        create: { diagramId: diagram.id, productId: productIds[p.sku], number: p.number, x: p.x, y: p.y, svgId: p.svgId, label: p.label },
      });
    }
  }

  for (const [from, to, note] of CROSS) {
    if (!productIds[from] || !productIds[to]) continue;
    await prisma.productCompatibility.upsert({
      where: { productId_targetId: { productId: productIds[from], targetId: productIds[to] } },
      update: { note },
      create: { productId: productIds[from], targetId: productIds[to], note },
    });
  }

  console.log(`Despiece listo: ${PARTS.length} piezas, ${DIAGRAMS.length} láminas, vehículo ${vehicle.brand} ${vehicle.model}.`);
}

main().finally(() => prisma.$disconnect());
