// 20 fichas de catálogo realista (marcas y referencias comerciales) para
// completar la tienda. No son datos de demostración: precios, stock, medidas y
// aplicaciones se pueden editar desde /admin/productos.
// Ejecutar: npx tsx prisma/seed-reales.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Real = {
  sku: string; slug: string; name: string; category: string; brand: string;
  price: number; compareAt?: number; stock: number; lowStockAt?: number; featured?: boolean;
  images: string[]; desc: string; specs: Record<string, string>;
  fits?: [string, string, number, number][];
};

const PRODUCTOS: Real[] = [
  {
    sku: "IMP-FRE-1001", slug: "pastillas-freno-brembo-p85020", name: "Pastillas de freno delanteras Brembo P85020",
    category: "frenos", brand: "Brembo", price: 42.5, compareAt: 49, stock: 24, lowStockAt: 6, featured: true,
    images: ["/products/brake-pad.webp", "/products/pastillas-freno-delanteras.svg"],
    desc: "Juego de cuatro pastillas para el eje delantero con compuesto de baja emisión de polvo. Frenada progresiva y silenciosa, pensada para uso urbano e interurbano.",
    specs: { Referencia: "P85020", Eje: "Delantero", Piezas: "4", Espesor: "17,3 mm", "Ancho x alto": "131,6 x 57,4 mm", Garantía: "12 meses" },
    fits: [["Toyota", "Corolla", 2014, 2019], ["Toyota", "Auris", 2013, 2018], ["Lexus", "CT 200h", 2011, 2017]],
  },
  {
    sku: "IMP-FRE-1002", slug: "discos-freno-bosch-0986479237", name: "Discos de freno ventilados Bosch 0 986 479 237 (par)",
    category: "frenos", brand: "Bosch", price: 118, stock: 12, lowStockAt: 4,
    images: ["/products/discos-freno-ventilados.svg", "/products/drum-brake-parts-jpg.webp"],
    desc: "Par de discos ventilados de 312 mm con recubrimiento anticorrosión. La ventilación interna evita el alabeo en frenadas repetidas y prolonga la vida de las pastillas.",
    specs: { Referencia: "0 986 479 237", Diámetro: "312 mm", Espesor: "25 mm", Ventilado: "Sí", Ejes: "Delantero", Piezas: "2" },
    fits: [["Volkswagen", "Golf VII", 2013, 2020], ["Audi", "A3", 2013, 2020], ["SEAT", "León", 2013, 2020]],
  },
  {
    sku: "IMP-FIL-2001", slug: "filtro-aceite-mann-w71275", name: "Filtro de aceite Mann-Filter W 712/75",
    category: "filtros", brand: "Mann-Filter", price: 9.8, stock: 48, lowStockAt: 10,
    images: ["/products/engine-oil-filter-cutaway.webp", "/products/filtro-aceite.svg"],
    desc: "Filtro de rosca con válvula antirretorno y medio filtrante de alta eficiencia. Retiene las partículas que más desgastan el motor desde el primer arranque en frío.",
    specs: { Referencia: "W 712/75", Rosca: "3/4-16 UNF", Altura: "79 mm", "Diámetro exterior": "76 mm", "Válvula antirretorno": "Sí", "Presión de apertura": "1,0 bar" },
    fits: [["Volkswagen", "Golf", 2004, 2013], ["Volkswagen", "Jetta", 2005, 2014], ["Audi", "A3", 2003, 2013]],
  },
  {
    sku: "IMP-FIL-2002", slug: "filtro-aire-mahle-lx1784", name: "Filtro de aire Mahle LX 1784",
    category: "filtros", brand: "Mahle", price: 16.4, stock: 32, lowStockAt: 8,
    images: ["/products/air-filter-opel-astra.webp", "/products/filtro-aire.svg"],
    desc: "Filtro de panel con papel plisado y marco de goma que sella sin holguras. Mantiene el caudal de admisión y protege el caudalímetro del polvo fino.",
    specs: { Referencia: "LX 1784", Tipo: "Panel", "Largo x ancho": "276 x 190 mm", Altura: "45 mm", Marco: "Goma", "Cambio recomendado": "Cada 20.000 km" },
    fits: [["Volkswagen", "Golf VII", 2013, 2020], ["Volkswagen", "Jetta", 2011, 2018], ["Audi", "A3", 2013, 2020]],
  },
  {
    sku: "IMP-FIL-2003", slug: "filtro-combustible-bosch-f026402035", name: "Filtro de combustible Bosch F026402035",
    category: "filtros", brand: "Bosch", price: 24.9, stock: 20, lowStockAt: 5,
    images: ["/products/fuel-filter.webp", "/products/filtro-combustible.svg"],
    desc: "Filtro de gasóleo con separación de agua y conexiones rápidas. Protege inyectores y bomba de alta presión de la suciedad y la condensación del diésel.",
    specs: { Referencia: "F026402035", Combustible: "Diésel", "Conexión entrada": "8 mm", "Conexión salida": "8 mm", "Separador de agua": "Sí", "Presión de trabajo": "Hasta 5 bar" },
    fits: [["Toyota", "Hilux", 2016, 2020], ["Toyota", "Fortuner", 2016, 2020]],
  },
  {
    sku: "IMP-ELE-3001", slug: "bateria-varta-blue-dynamic-d24-60ah", name: "Batería Varta Blue Dynamic D24 12V 60Ah",
    category: "electrico", brand: "Varta", price: 96, compareAt: 109, stock: 15, lowStockAt: 4, featured: true,
    images: ["/products/car-battery.webp", "/products/bateria-12v-60ah.svg"],
    desc: "Batería de plomo-calcio sellada, libre de mantenimiento y con bornes protegidos. Buen arranque en caliente y tolerancia a descargas leves del uso urbano.",
    specs: { Modelo: "D24", Voltaje: "12 V", Capacidad: "60 Ah", CCA: "540 A", "Polos": "A / B", "Dimensiones": "242 x 175 x 190 mm", Garantía: "18 meses" },
    fits: [["Toyota", "Corolla", 2009, 2019], ["Hyundai", "Elantra", 2011, 2020], ["Kia", "Sportage", 2011, 2018]],
  },
  {
    sku: "IMP-ELE-3002", slug: "alternador-bosch-0986048370", name: "Alternador Bosch 0 986 048 370 12V 70A",
    category: "electrico", brand: "Bosch", price: 189, stock: 6, lowStockAt: 2,
    images: ["/products/car-alternator-on-a-workbench.webp", "/products/alternador-12v-70a.svg"],
    desc: "Alternador nuevo con regulador electrónico y polea desacoplada. Carga estable incluso con aire acondicionado, luces y equipos de sonido encendidos.",
    specs: { Referencia: "0 986 048 370", Voltaje: "12 V", Intensidad: "70 A", Polea: "Desacoplada", "Sentido de giro": "Horario", Garantía: "12 meses" },
    fits: [["Toyota", "Corolla", 2009, 2013], ["Toyota", "Matrix", 2009, 2013]],
  },
  {
    sku: "IMP-ELE-3003", slug: "motor-arranque-valeo-438087", name: "Motor de arranque Valeo 438087 12V 1,2 kW",
    category: "electrico", brand: "Valeo", price: 164, stock: 5, lowStockAt: 2,
    images: ["/products/electri-motor-starter.webp", "/products/motor-arranque.svg"],
    desc: "Motor de arranque remanufacturado con inducido, escobillas y solenoide revisados. Arranque firme en frío sin ruido de piñón.",
    specs: { Referencia: "438087", Voltaje: "12 V", Potencia: "1,2 kW", Dientes: "9", "Tipo de piñón": "Desplazable", Estado: "Remanufacturado", Garantía: "12 meses" },
    fits: [["Renault", "Logan", 2004, 2012], ["Renault", "Sandero", 2008, 2014], ["Dacia", "Duster", 2010, 2015]],
  },
  {
    sku: "IMP-ELE-3004", slug: "bujias-ngk-bkr6eix11-iridio", name: "Bujías NGK BKR6EIX-11 de iridio (juego 4)",
    category: "electrico", brand: "NGK", price: 38, stock: 36, lowStockAt: 8,
    images: ["/products/engine-spark-plugs.webp", "/products/bujias-iridio-juego.svg"],
    desc: "Cuatro bujías con electrodo central de iridio y punta de platino. Chispa más estable, arranque rápido y menor consumo en motores de gasolina modernos.",
    specs: { Referencia: "BKR6EIX-11", Electrodo: "Iridio", Rosca: "M14 x 1,25", "Hexágono": "16 mm", "Separación": "1,1 mm", "Vida útil": "60.000 km", Piezas: "4" },
    fits: [["Toyota", "Corolla", 2009, 2019], ["Honda", "Civic", 2012, 2020], ["Hyundai", "Elantra", 2011, 2018]],
  },
  {
    sku: "IMP-SUS-4001", slug: "amortiguador-monroe-oespectrum-37250", name: "Amortiguador trasero Monroe OESpectrum 37250",
    category: "suspension", brand: "Monroe", price: 58, stock: 18, lowStockAt: 4,
    images: ["/products/amortiguador-trasero.svg", "/products/ohlins.webp"],
    desc: "Amortiguador presurizado de gas con válvula de doble efecto. Controla el rebote en badenes y mantiene la altura del vehículo con carga.",
    specs: { Referencia: "37250", Tipo: "Gas presurizado", Eje: "Trasero", Montaje: "Ojo-ojo", "Longitud extendida": "539 mm", "Longitud comprimida": "347 mm", Piezas: "1" },
    fits: [["Toyota", "Corolla", 2003, 2008], ["Toyota", "Matrix", 2003, 2008]],
  },
  {
    sku: "IMP-SUS-4002", slug: "amortiguadores-kyb-excel-g-delanteros", name: "Amortiguadores delanteros KYB Excel-G (par)",
    category: "suspension", brand: "KYB", price: 132, stock: 9, lowStockAt: 3,
    images: ["/products/amortiguadores-delanteros-par.svg", "/products/ohlins.webp"],
    desc: "Par de amortiguadores delanteros de gas con válvula calibrada para recuperar el confort original. Reduce el balanceo y mejora la estabilidad en curva.",
    specs: { Línea: "Excel-G", Tipo: "Gas", Eje: "Delantero", Piezas: "2", "Tipo de montaje": "MacPherson", Garantía: "24 meses" },
    fits: [["Hyundai", "Accent", 2011, 2017], ["Kia", "Rio", 2011, 2017]],
  },
  {
    sku: "IMP-SUS-4003", slug: "rotula-suspension-moog-k90344", name: "Rótula de suspensión Moog K90344",
    category: "suspension", brand: "Moog", price: 34.5, stock: 22, lowStockAt: 5,
    images: ["/products/tie-rod-end.webp", "/products/rotulas-direccion.svg"],
    desc: "Rótula de acero forjado con guardapolvo de goma y engrase permanente. Elimina holguras y ruidos en la dirección sobre caminos irregulares.",
    specs: { Referencia: "K90344", Material: "Acero forjado", Rosca: "M14 x 1,5", "Tipo": "Inferior", Engrase: "Permanente", Piezas: "1" },
    fits: [["Ford", "Ranger", 2006, 2011], ["Mazda", "BT-50", 2006, 2011]],
  },
  {
    sku: "IMP-MOT-5001", slug: "kit-distribucion-gates-k015603xs", name: "Kit de distribución Gates K015603XS",
    category: "motor", brand: "Gates", price: 128, compareAt: 145, stock: 8, lowStockAt: 2, featured: true,
    images: ["/products/timing-belt.webp", "/products/kit-distribucion.svg"],
    desc: "Kit completo con correa dentada, tensor y rodillo guía. Compuesto resistente al calor y marcado de sincronización para un montaje seguro.",
    specs: { Referencia: "K015603XS", Motor: "1.4 / 1.6 16V", Dientes: "141", Ancho: "25 mm", "Cambio recomendado": "Cada 60.000 km o 5 años", Incluye: "Correa, tensor y rodillo" },
    fits: [["Peugeot", "206", 2002, 2012], ["Citroën", "C3", 2004, 2014], ["Citroën", "Berlingo", 2002, 2012]],
  },
  {
    sku: "IMP-MOT-5002", slug: "bomba-agua-skf-vkpc81422", name: "Bomba de agua SKF VKPC 81422",
    category: "motor", brand: "SKF", price: 52, stock: 14, lowStockAt: 4,
    images: ["/products/bomba-agua.svg", "/products/car-engine.webp"],
    desc: "Bomba de agua con junta y retén de alta resistencia. Sustituirla junto a la correa de distribución evita fugas y sobrecalentamiento.",
    specs: { Referencia: "VKPC 81422", Material: "Aluminio", "Tipo de accionamiento": "Correa", Junta: "Incluida", "Caudal nominal": "85 l/min", Garantía: "12 meses" },
    fits: [["Peugeot", "206", 2002, 2012], ["Citroën", "C3", 2004, 2014], ["Citroën", "Berlingo", 2002, 2012]],
  },
  {
    sku: "IMP-LUC-6001", slug: "faro-led-delantero-h4-6000k", name: "Faro LED delantero H4 6000K 12V",
    category: "luces", brand: "Osram", price: 74, stock: 16, lowStockAt: 4,
    images: ["/products/faro-led-delantero.svg", "/products/headlamps-of-pontiac-bonneville-1965-xzz700.webp"],
    desc: "Faro LED con lente proyectora y disipador de aluminio para una luz blanca uniforme. Haz de corte definido para no deslumbrar al tráfico contrario.",
    specs: { Casquillo: "H4", Temperatura: "6000 K", Voltaje: "12-24 V", Potencia: "30 W", Lúmenes: "4.000 lm", "Vida útil": "30.000 h" },
  },
  {
    sku: "IMP-LUC-6002", slug: "bombillas-osram-night-breaker-200-h4", name: "Bombillas Osram Night Breaker 200 H4 (par)",
    category: "luces", brand: "Osram", price: 32, stock: 28, lowStockAt: 6,
    images: ["/products/halogen-bulb.webp", "/products/kit-bombillas-h4.svg"],
    desc: "Par de bombillas halógenas H4 con hasta un 200% más de visibilidad y un haz más largo. Luz más blanca sin reformas ni homologaciones adicionales.",
    specs: { Casquillo: "H4", Voltaje: "12 V", Potencia: "60/55 W", "Temperatura de color": "3.900 K", Piezas: "2", Homologación: "ECE R37" },
  },
  {
    sku: "IMP-CAR-7001", slug: "espejo-retrovisor-electrico-universal", name: "Espejo retrovisor eléctrico universal",
    category: "carroceria", brand: "TYC", price: 68, stock: 10, lowStockAt: 3,
    images: ["/products/car-wing-mirror.webp", "/products/espejo-retrovisor-electrico.svg"],
    desc: "Espejo exterior con ajuste eléctrico, intermitente integrado y luna antirreflejo. Sustituye la pieza original sin modificar el conector.",
    specs: { Lado: "Derecho", Ajuste: "Eléctrico", "Intermitente": "Integrado", "Luna": "Antirreflejo", "Color de carcasa": "Negro", Garantía: "12 meses" },
    fits: [["Toyota", "Corolla", 2014, 2019], ["Hyundai", "Elantra", 2016, 2020], ["Kia", "Cerato", 2013, 2018]],
  },
  {
    sku: "IMP-CAR-7002", slug: "parachoques-delantero-toyota-corolla-2014-2019", name: "Parachoques delantero Toyota Corolla 2014-2019",
    category: "carroceria", brand: "TYC", price: 215, stock: 4, lowStockAt: 2,
    images: ["/products/car-bumper-front-national-exhibition.webp", "/products/parachoques-delantero.svg"],
    desc: "Parachoques delantero de ABS con imprimación lista para pintar. Encaja en los anclajes originales e incluye rejilla inferior y soportes.",
    specs: { "Aplicación": "Toyota Corolla 2014-2019", Material: "ABS", Acabado: "Imprimado", Incluye: "Rejilla inferior y soportes", "Lado": "Delantero", Garantía: "12 meses" },
    fits: [["Toyota", "Corolla", 2014, 2019]],
  },
  {
    sku: "IMP-TRI-8001", slug: "triciclo-electrico-carga-500kg", name: "Triciclo eléctrico de carga 500 kg",
    category: "triciclos-electricos", brand: "EcoCargo", price: 2450, compareAt: 2690, stock: 3, lowStockAt: 1, featured: true,
    images: ["/products/cargo-500-eec.webp", "/products/triciclo-electrico-cargo.svg"],
    desc: "Triciclo de carga con caja metálica basculante, motor de 1.200 W y batería de litio extraíble. Pensado para reparto urbano y transporte de mercancías.",
    specs: { "Carga útil": "500 kg", Motor: "1.200 W", Batería: "60 V / 45 Ah litio", Autonomía: "70 km", "Velocidad máxima": "45 km/h", Frenos: "Tambor delantero y trasero", "Caja de carga": "1,5 m³ basculante" },
  },
  {
    sku: "IMP-TRI-8002", slug: "patinete-electrico-urbano-350w", name: "Patinete eléctrico urbano 350 W",
    category: "triciclos-electricos", brand: "UrbanVolt", price: 389, stock: 12, lowStockAt: 4,
    images: ["/products/seattle-wa-usa-pike-street-e-scooter-2022-14.webp", "/products/patinete-electrico-urbano.svg"],
    desc: "Patinete plegable con motor de 350 W, freno de disco y suspensión trasera. Autonomía suficiente para trayectos urbanos y plegado rápido en el maletero.",
    specs: { Motor: "350 W", Batería: "36 V / 10 Ah", Autonomía: "35 km", "Velocidad máxima": "25 km/h", Ruedas: "8,5 pulgadas", Frenos: "Disco trasero", "Peso máximo": "120 kg" },
  },
];

const slugMarca = (s: string) => s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");

async function main() {
  const categorias = await prisma.category.findMany({ select: { id: true, slug: true } });
  const porSlug = new Map(categorias.map((c) => [c.slug, c.id]));

  for (const p of PRODUCTOS) {
    const categoryId = porSlug.get(p.category);
    if (!categoryId) throw new Error(`Falta la categoría ${p.category} para ${p.sku}`);
    const brand = await prisma.brand.upsert({
      where: { slug: slugMarca(p.brand) },
      create: { slug: slugMarca(p.brand), name: p.brand },
      update: { name: p.brand },
    });
    const datos = {
      slug: p.slug, name: p.name, description: p.desc, priceUsd: p.price,
      compareAtUsd: p.compareAt ?? null, stock: p.stock, lowStockAt: p.lowStockAt ?? 3,
      images: p.images, specs: p.specs, featured: !!p.featured, active: true,
      brandId: brand.id, categoryId,
    };
    const producto = await prisma.product.upsert({
      where: { sku: p.sku },
      create: { sku: p.sku, ...datos },
      update: datos,
    });
    await prisma.productFit.deleteMany({ where: { productId: producto.id } });
    if (p.fits?.length) {
      await prisma.productFit.createMany({
        data: p.fits.map(([make, model, yearFrom, yearTo]) => ({ productId: producto.id, make, model, yearFrom, yearTo })),
      });
    }
  }
  console.log(`Catálogo realista listo: ${PRODUCTOS.length} productos.`);
}

main().finally(() => prisma.$disconnect());
