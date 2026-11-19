// Ejecutar: npx tsx prisma/seed.ts
import { existsSync } from "node:fs";
import path from "node:path";
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

const GEO: [string, string, string[]][] = [
  ["CU-01", "Pinar del Río", ["Consolación del Sur", "Guane", "La Palma", "Los Palacios", "Mantua", "Minas de Matahambre", "Pinar del Río", "San Juan y Martínez", "San Luis", "Sandino", "Viñales"]],
  ["CU-15", "Artemisa", ["Alquízar", "Artemisa", "Bahía Honda", "Bauta", "Caimito", "Candelaria", "Guanajay", "Güira de Melena", "Mariel", "San Antonio de los Baños", "San Cristóbal"]],
  ["CU-03", "La Habana", ["Arroyo Naranjo", "Boyeros", "Centro Habana", "Cerro", "Cotorro", "Diez de Octubre", "Guanabacoa", "La Habana del Este", "La Habana Vieja", "La Lisa", "Marianao", "Playa", "Plaza de la Revolución", "Regla", "San Miguel del Padrón"]],
  ["CU-16", "Mayabeque", ["Batabanó", "Bejucal", "Güines", "Jaruco", "Madruga", "Melena del Sur", "Nueva Paz", "Quivicán", "San José de las Lajas", "San Nicolás de Bari", "Santa Cruz del Norte"]],
  ["CU-04", "Matanzas", ["Calimete", "Cárdenas", "Ciénaga de Zapata", "Colón", "Jagüey Grande", "Jovellanos", "Limonar", "Los Arabos", "Martí", "Matanzas", "Pedro Betancourt", "Perico", "Unión de Reyes"]],
  ["CU-06", "Cienfuegos", ["Abreus", "Aguada de Pasajeros", "Cienfuegos", "Cruces", "Cumanayagua", "Lajas", "Palmira", "Rodas"]],
  ["CU-05", "Villa Clara", ["Caibarién", "Camajuaní", "Cifuentes", "Corralillo", "Encrucijada", "Manicaragua", "Placetas", "Quemado de Güines", "Ranchuelo", "Remedios", "Sagua la Grande", "Santa Clara", "Santo Domingo"]],
  ["CU-07", "Sancti Spíritus", ["Cabaiguán", "Fomento", "Jatibonico", "La Sierpe", "Sancti Spíritus", "Taguasco", "Trinidad", "Yaguajay"]],
  ["CU-08", "Ciego de Ávila", ["Baraguá", "Bolivia", "Chambas", "Ciego de Ávila", "Ciro Redondo", "Florencia", "Majagua", "Morón", "Primero de Enero", "Venezuela"]],
  ["CU-09", "Camagüey", ["Camagüey", "Carlos Manuel de Céspedes", "Esmeralda", "Florida", "Guáimaro", "Jimaguayú", "Minas", "Najasa", "Nuevitas", "Santa Cruz del Sur", "Sibanicú", "Sierra de Cubitas", "Vertientes"]],
  ["CU-10", "Las Tunas", ["Amancio", "Colombia", "Jesús Menéndez", "Jobabo", "Las Tunas", "Majibacoa", "Manatí", "Puerto Padre"]],
  ["CU-11", "Holguín", ["Antilla", "Báguanos", "Banes", "Cacocum", "Calixto García", "Cueto", "Frank País", "Gibara", "Holguín", "Mayarí", "Moa", "Rafael Freyre", "Sagua de Tánamo", "Urbano Noris"]],
  ["CU-12", "Granma", ["Bartolomé Masó", "Bayamo", "Buey Arriba", "Campechuela", "Cauto Cristo", "Guisa", "Jiguaní", "Manzanillo", "Media Luna", "Niquero", "Pilón", "Río Cauto", "Yara"]],
  ["CU-13", "Santiago de Cuba", ["Contramaestre", "Guamá", "Mella", "Palma Soriano", "San Luis", "Santiago de Cuba", "Segundo Frente", "Songo-La Maya", "Tercer Frente"]],
  ["CU-14", "Guantánamo", ["Baracoa", "Caimanera", "El Salvador", "Guantánamo", "Imías", "Maisí", "Manuel Tames", "Niceto Pérez", "San Antonio del Sur", "Yateras"]],
  ["CU-99", "Isla de la Juventud", ["Isla de la Juventud"]],
];

async function main() {
  for (const [code, name, muns] of GEO) {
    const p = await prisma.province.upsert({ where: { code }, update: { name }, create: { code, name } });
    for (const m of muns) {
      await prisma.municipality.upsert({
        where: { provinceId_name: { provinceId: p.id, name: m } },
        update: {}, create: { name: m, provinceId: p.id },
      });
    }
  }
  // Métodos iniciales con precio 0: el administrador define tarifas y zonas en el panel.
  const methods = [
    { code: "DOMICILIO", name: "Entrega a domicilio", kind: "HOME_DELIVERY" as const, requiresAddress: true, cashOnDelivery: true, sortOrder: 1 },
    { code: "RECOGIDA", name: "Recogida en la tienda", kind: "STORE_PICKUP" as const, requiresAddress: false, cashOnDelivery: true, sortOrder: 2, etaMinDays: 0, etaMaxDays: 1 },
    { code: "MENSAJERIA", name: "Envío a otra provincia (mensajería)", kind: "COURIER" as const, requiresAddress: true, sortOrder: 3, etaMinDays: 3, etaMaxDays: 7 },
    { code: "PUNTO", name: "Entrega en punto acordado", kind: "AGREED_POINT" as const, requiresAddress: false, sortOrder: 4 },
  ];
  for (const m of methods) await prisma.deliveryMethod.upsert({ where: { code: m.code }, update: {}, create: m });
  await prisma.serviceAddon.upsert({ where: { code: "INSTALACION" }, update: {}, create: { code: "INSTALACION", name: "Instalación / montaje de la pieza", priceUsd: 0, active: false } });
  // ── Datos DEMO (reemplazar por el catálogo real vía panel/carga masiva) ──
  const cat = async (slug: string, name: string) => prisma.category.upsert({ where: { slug }, update: {}, create: { slug, name } });
  const [frenos, electrico, suspension, triciclos, motor, filtros, luces, carroceria, accesorios] = await Promise.all([
    cat("frenos", "Frenos"), cat("electrico", "Sistema eléctrico"), cat("suspension", "Suspensión"),
    cat("triciclos-electricos", "Triciclos eléctricos"), cat("motor", "Motor"), cat("filtros", "Filtros"),
    cat("luces", "Luces e iluminación"), cat("carroceria", "Carrocería"), cat("accesorios", "Accesorios"),
  ]);
  const brandOf = async (name: string) => {
    const slug = name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
    return prisma.brand.upsert({ where: { slug }, update: {}, create: { slug, name } });
  };

  type Demo = { slug: string; sku: string; name: string; cat: number; brand: string; price: number; compareAt?: number; stock: number; featured?: boolean; desc: string; specs?: Record<string, string>; fits?: [string, string, number, number][]; model3dUrl?: string };
  const DEMO: Demo[] = [
    { slug: "pastillas-freno-delanteras", sku: "FR-1001", name: "Pastillas de freno delanteras", cat: frenos.id, brand: "Brembo", price: 25, compareAt: 32, stock: 12, featured: true, desc: "Juego de 4 pastillas de freno delanteras de compuesto cerámico. Bajo nivel de polvo y ruido, frenada estable en caliente y en frío.", specs: { "Composición": "Cerámica", "Ejes": "Delantero", "Piezas": "4", "Espesor": "17 mm" }, fits: [["Toyota", "Corolla", 2010, 2018], ["Toyota", "Yaris", 2012, 2020]] },
    { slug: "discos-freno-ventilados", sku: "FR-1002", name: "Discos de freno ventilados", cat: frenos.id, brand: "Brembo", price: 68, stock: 6, featured: true, desc: "Par de discos ventilados de fundición de alta resistencia, con recubrimiento anticorrosión.", specs: { "Diámetro": "280 mm", "Ejes": "Delantero", "Ventilado": "Sí" }, fits: [["Hyundai", "Elantra", 2011, 2019]] },
    { slug: "liquido-frenos-dot4", sku: "FR-1003", name: "Líquido de frenos DOT-4", cat: frenos.id, brand: "Bosch", price: 9.5, stock: 30, desc: "Líquido de frenos DOT-4 de alto punto de ebullición, 500 ml.", specs: { "Norma": "DOT-4", "Contenido": "500 ml" } },
    { slug: "amortiguador-trasero", sku: "SU-2001", name: "Amortiguador trasero", cat: suspension.id, brand: "Monroe", price: 40, compareAt: 49, stock: 8, featured: true, desc: "Amortiguador de gas trasero que mejora la estabilidad y reduce el rebote.", specs: { "Tipo": "Gas", "Ejes": "Trasero" }, fits: [["Hyundai", "Accent", 2008, 2016], ["Kia", "Rio", 2010, 2017]] },
    { slug: "amortiguadores-delanteros-par", sku: "SU-2002", name: "Amortiguadores delanteros (par)", cat: suspension.id, brand: "Monroe", price: 96, stock: 4, desc: "Par de amortiguadores delanteros para uso urbano y carretera.", specs: { "Tipo": "Gas", "Ejes": "Delantero", "Piezas": "2" }, fits: [["Toyota", "Corolla", 2009, 2018]] },
    { slug: "rotulas-direccion", sku: "SU-2003", name: "Rótulas de dirección", cat: suspension.id, brand: "TRW", price: 28, stock: 10, desc: "Rótulas de dirección con guardapolvo de goma y engrase permanente.", specs: { "Piezas": "2", "Material": "Acero forjado" } },
    { slug: "bateria-12v-60ah", sku: "EL-3001", name: "Batería 12V 60Ah", cat: electrico.id, brand: "Varta", price: 85, stock: 5, featured: true, desc: "Batería libre de mantenimiento de 60Ah, arranque fiable en climas cálidos.", specs: { "Voltaje": "12 V", "Capacidad": "60 Ah", "CCA": "540 A" } },
    { slug: "alternador-12v-70a", sku: "EL-3002", name: "Alternador 12V 70A", cat: electrico.id, brand: "Bosch", price: 140, compareAt: 165, stock: 3, desc: "Alternador remanufacturado con regulador nuevo y garantía.", specs: { "Voltaje": "12 V", "Amperaje": "70 A" }, fits: [["Chevrolet", "Aveo", 2008, 2016]] },
    { slug: "motor-arranque", sku: "EL-3003", name: "Motor de arranque", cat: electrico.id, brand: "Bosch", price: 110, stock: 4, desc: "Motor de arranque de alto par, con piñón y bobinado reforzados.", specs: { "Voltaje": "12 V", "Potencia": "1.2 kW" } },
    { slug: "bujias-iridio-juego", sku: "EL-3004", name: "Bujías de iridio (juego 4)", cat: electrico.id, brand: "NGK", price: 32, stock: 20, desc: "Juego de 4 bujías de iridio: mejor arranque, consumo y durabilidad.", specs: { "Electrodo": "Iridio", "Piezas": "4" }, fits: [["Toyota", "Corolla", 2005, 2019]] },
    { slug: "triciclo-electrico-cargo", sku: "TE-4001", name: "Triciclo eléctrico de carga", cat: triciclos.id, brand: "Impacto EV", price: 1200, compareAt: 1350, stock: 2, featured: true, desc: "Triciclo eléctrico de carga con caja trasera de 200 kg, ideal para reparto y transporte de mercancías.", specs: { "Autonomía": "80 km", "Carga útil": "200 kg", "Motor": "1000 W", "Batería": "60 V / 20 Ah" } },
    { slug: "bicicleta-electrica-plegable", sku: "TE-4002", name: "Bicicleta eléctrica plegable", cat: triciclos.id, brand: "Impacto EV", price: 680, stock: 5, desc: "Bicicleta eléctrica plegable con motor de 350 W y batería extraíble.", specs: { "Autonomía": "45 km", "Motor": "350 W", "Batería": "36 V / 10 Ah", "Plegable": "Sí" } },
    { slug: "patinete-electrico-urbano", sku: "TE-4003", name: "Patinete eléctrico urbano", cat: triciclos.id, brand: "Impacto EV", price: 420, compareAt: 480, stock: 7, desc: "Patinete eléctrico ligero para ciudad, con freno eléctrico y luces LED.", specs: { "Autonomía": "30 km", "Velocidad máx.": "25 km/h", "Peso": "12 kg" } },
    { slug: "motor-1-6-16v-completo", sku: "MO-5001", name: "Motor 1.6 16V completo", cat: motor.id, brand: "Marca demo", price: 1450, stock: 1, desc: "Motor 1.6 16V revisado, con garantía de funcionamiento.", specs: { "Cilindrada": "1.6 L", "Válvulas": "16V", "Combustible": "Gasolina" } },
    { slug: "kit-distribucion", sku: "MO-5002", name: "Kit de distribución", cat: motor.id, brand: "Gates", price: 75, stock: 9, desc: "Kit completo: correa, tensor y rodillos. Sustitución recomendada cada 60.000 km.", specs: { "Componentes": "Correa + tensor + rodillos" }, fits: [["Peugeot", "206", 2002, 2012]] },
    { slug: "bomba-agua", sku: "MO-5003", name: "Bomba de agua", cat: motor.id, brand: "SKF", price: 48, stock: 6, desc: "Bomba de agua con junta incluida, para el circuito de refrigeración.", specs: { "Junta incluida": "Sí" } },
    { slug: "filtro-aceite", sku: "FI-6001", name: "Filtro de aceite", cat: filtros.id, brand: "Mann", price: 7, stock: 40, desc: "Filtro de aceite de alta eficiencia con válvula antirretorno.", specs: { "Rosca": "3/4-16 UNF", "Altura": "95 mm" } },
    { slug: "filtro-aire", sku: "FI-6002", name: "Filtro de aire", cat: filtros.id, brand: "Mann", price: 12, compareAt: 15, stock: 25, desc: "Filtro de aire de panel que protege el motor y mejora el consumo.", specs: { "Tipo": "Panel" }, fits: [["Toyota", "Corolla", 2009, 2018]] },
    { slug: "filtro-combustible", sku: "FI-6003", name: "Filtro de combustible", cat: filtros.id, brand: "Bosch", price: 14, stock: 18, desc: "Filtro de combustible que protege la inyección de impurezas y agua.", specs: { "Tipo": "En línea" } },
    { slug: "faro-led-delantero", sku: "LU-7001", name: "Faro LED delantero", cat: luces.id, brand: "Philips", price: 58, stock: 8, featured: true, desc: "Faro delantero LED de alta luminosidad, con haz amplio y bajo consumo.", specs: { "Temperatura": "6000 K", "Tensión": "12 V" } },
    { slug: "kit-bombillas-h4", sku: "LU-7002", name: "Kit de bombillas H4", cat: luces.id, brand: "Osram", price: 19, compareAt: 24, stock: 22, desc: "Par de bombillas halógenas H4 de larga duración y luz blanca.", specs: { "Casquillo": "H4", "Piezas": "2" } },
    { slug: "espejo-retrovisor-electrico", sku: "CA-8001", name: "Espejo retrovisor eléctrico", cat: carroceria.id, brand: "Marca demo", price: 52, stock: 5, desc: "Espejo retrovisor lateral con ajuste eléctrico y carcasa plegable.", specs: { "Ajuste": "Eléctrico", "Lado": "Izquierdo" } },
    { slug: "parachoques-delantero", sku: "CA-8002", name: "Parachoques delantero", cat: carroceria.id, brand: "Marca demo", price: 180, stock: 2, desc: "Parachoques delantero de ABS, listo para pintar.", specs: { "Material": "ABS", "Pintado": "No" } },
    { slug: "alfombrillas-goma-juego", sku: "AC-9001", name: "Alfombrillas de goma (juego)", cat: accesorios.id, brand: "Marca demo", price: 22, stock: 15, desc: "Juego de 4 alfombrillas de goma antideslizante, fáciles de limpiar.", specs: { "Piezas": "4", "Material": "Goma" } },
    { slug: "soporte-telefono-auto", sku: "AC-9002", name: "Soporte de teléfono para auto", cat: accesorios.id, brand: "Marca demo", price: 11, compareAt: 14, stock: 30, desc: "Soporte magnético ajustable para salida de aire, con base antideslizante.", specs: { "Tipo": "Magnético", "Montaje": "Salida de aire" } },
    { slug: "cargador-usb-doble", sku: "AC-9003", name: "Cargador USB doble 12V", cat: accesorios.id, brand: "Marca demo", price: 13, stock: 28, desc: "Cargador doble USB con carga rápida y protección contra sobrecarga.", specs: { "Puertos": "2", "Salida": "3.1 A" } },
  ];

  for (const d of DEMO) {
    const b = await brandOf(d.brand);
    const { fits, cat: catId, brand, price, compareAt, desc, specs, model3dUrl, featured, ...rest } = d;
    // Cada producto demo trae su modelo 3D generado (npm run models:build). Si el
    // archivo no existe todavía, se deja sin 3D para no enlazar a algo inexistente.
    const model = model3dUrl ?? (existsSync(path.join(process.cwd(), "public", "models", `${d.slug}.glb`)) ? `/models/${d.slug}.glb` : null);
    const row = await prisma.product.upsert({
      where: { slug: d.slug },
      update: {
        categoryId: catId, brandId: b.id, priceUsd: price, compareAtUsd: compareAt ?? null,
        images: [`/products/${d.slug}.svg`], description: desc, specs: specs ?? undefined,
        featured: featured ?? false, model3dUrl: model,
      },
      create: {
        ...rest, categoryId: catId, brandId: b.id, priceUsd: price, compareAtUsd: compareAt ?? null,
        images: [`/products/${d.slug}.svg`], description: desc, specs: specs ?? undefined,
        featured: featured ?? false, model3dUrl: model,
      },
    });
    if (fits?.length && !(await prisma.productFit.count({ where: { productId: row.id } })))
      await prisma.productFit.createMany({ data: fits.map(([make, model, yearFrom, yearTo]) => ({ productId: row.id, make, model, yearFrom, yearTo })) });
  }
  console.log("Seed OK: 16 provincias, 168 municipios, métodos de entrega y catálogo demo.");
}
main().finally(() => prisma.$disconnect());
