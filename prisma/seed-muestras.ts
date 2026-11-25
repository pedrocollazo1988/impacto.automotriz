// 20 fichas de muestra con fotos reales (Wikimedia Commons) y varias categorías.
// Ejecutar: npx tsx prisma/seed-muestras.ts
import { PrismaClient } from "@prisma/client";
const prisma = new PrismaClient();

type Muestra = {
  slug: string; sku: string; name: string; category: string; brand: string;
  price: number; compareAt?: number; stock: number; featured?: boolean;
  image: string; desc: string; specs: Record<string, string>;
  fits?: [string, string, number, number][];
};

const MUESTRAS: Muestra[] = [
  {
    slug: "muestras-pastillas-ceramicas", sku: "MUE-1001", name: "Pastillas de freno cerámicas (juego 4)",
    category: "frenos", brand: "Brembo", price: 29.9, compareAt: 36, stock: 18, featured: true,
    image: "/products/muestras/frenos-pastillas-ceramicas.webp",
    desc: "Juego de cuatro pastillas cerámicas para eje delantero. Menos polvo, menos ruido y frenada estable en frío y en caliente.",
    specs: { Composición: "Cerámica", Ejes: "Delantero", Piezas: "4", Espesor: "17 mm" },
    fits: [["Toyota", "Corolla", 2010, 2018], ["Toyota", "Yaris", 2012, 2020]],
  },
  {
    slug: "muestras-discos-perforados", sku: "MUE-1002", name: "Discos de freno perforados y ranurados",
    category: "frenos", brand: "Brembo", price: 89, stock: 8, featured: true,
    image: "/products/muestras/frenos-discos-perforados.webp",
    desc: "Par de discos ventilados con perforaciones y ranuras que evacuan agua y gas, mejorando la mordida del freno.",
    specs: { Diámetro: "300 mm", Ejes: "Delantero", Ventilado: "Sí", Acabado: "Anticorrosión" },
    fits: [["Hyundai", "Elantra", 2011, 2019], ["Kia", "Cerato", 2013, 2020]],
  },
  {
    slug: "muestras-bateria-55ah", sku: "MUE-2001", name: "Batería 12V 55Ah libre de mantenimiento",
    category: "electrico", brand: "Varta", price: 79, stock: 12,
    image: "/products/muestras/electrico-bateria-agm.webp",
    desc: "Batería de plomo-calcio sellada, con bornes protegidos y alta capacidad de arranque para clima cálido.",
    specs: { Voltaje: "12 V", Capacidad: "55 Ah", CCA: "480 A", Mantenimiento: "Libre" },
  },
  {
    slug: "muestras-bujias-iridio", sku: "MUE-2002", name: "Bujías de iridio (juego 4)",
    category: "electrico", brand: "NGK", price: 34, stock: 30,
    image: "/products/muestras/electrico-bujias-iridio.webp",
    desc: "Electrodo central de iridio para chispa más estable, arranque rápido y menor consumo.",
    specs: { Electrodo: "Iridio", Piezas: "4", Rosca: "M14", "Vida útil": "60.000 km" },
    fits: [["Toyota", "Corolla", 2005, 2019], ["Honda", "Civic", 2006, 2018]],
  },
  {
    slug: "muestras-alternador-12v", sku: "MUE-2003", name: "Alternador 12V 90A remanufacturado",
    category: "electrico", brand: "Bosch", price: 145, stock: 5,
    image: "/products/car-alternator-on-a-workbench.webp",
    desc: "Alternador revisado con regulador y rodamientos nuevos. Carga estable para aire acondicionado y luces adicionales.",
    specs: { Voltaje: "12 V", Amperaje: "90 A", Estado: "Remanufacturado", Garantía: "6 meses" },
  },
  {
    slug: "muestras-amortiguador-gas", sku: "MUE-3001", name: "Amortiguador de gas trasero",
    category: "suspension", brand: "Monroe", price: 46, stock: 10,
    image: "/products/muestras/suspension-amortiguador-gas.webp",
    desc: "Amortiguador presurizado con válvula de doble efecto para controlar el rebote y mantener la estabilidad.",
    specs: { Tipo: "Gas", Eje: "Trasero", Piezas: "1", Montaje: "Ojo-ojo" },
    fits: [["Hyundai", "Accent", 2008, 2016], ["Kia", "Rio", 2010, 2017]],
  },
  {
    slug: "muestras-rotula-suspension", sku: "MUE-3002", name: "Rótula de suspensión reforzada",
    category: "suspension", brand: "TRW", price: 31, stock: 14,
    image: "/products/muestras/suspension-rotula-suspension.webp",
    desc: "Rótula de acero forjado con guardapolvo de goma y engrase permanente para caminos irregulares.",
    specs: { Material: "Acero forjado", Piezas: "1", Guardapolvo: "Goma", Engrase: "Permanente" },
  },
  {
    slug: "muestras-correa-distribucion", sku: "MUE-4001", name: "Correa de distribución reforzada",
    category: "motor", brand: "Gates", price: 72, stock: 11,
    image: "/products/muestras/motor-correa-distribucion.webp",
    desc: "Correa de distribución de compuesto resistente al calor, con dientes reforzados y marcado de sincronización.",
    specs: { Tipo: "Dentada", Material: "HNBR", Dientes: "141", Cambio: "Cada 60.000 km" },
    fits: [["Peugeot", "206", 2002, 2012], ["Citroën", "C3", 2004, 2014]],
  },
  {
    slug: "muestras-aros-piston", sku: "MUE-4002", name: "Juego de aros de pistón",
    category: "motor", brand: "Mahle", price: 58, stock: 7,
    image: "/products/muestras/motor-aros-piston.webp",
    desc: "Juego de segmentos para una reparación de motor: compresión, lubricación y control de aceite.",
    specs: { Piezas: "3 por pistón", Medida: "Estándar", Material: "Acero y cromo" },
  },
  {
    slug: "muestras-junta-culata", sku: "MUE-4003", name: "Junta de culata multicapa",
    category: "motor", brand: "Victor Reinz", price: 42, stock: 9,
    image: "/products/muestras/motor-junta-culata.webp",
    desc: "Junta de culata multicapa de acero con recubrimiento elastómero para sellar cámaras de agua y aceite.",
    specs: { Tipo: "Multicapa", Material: "Acero", Espesor: "1,2 mm", Piezas: "1" },
  },
  {
    slug: "muestras-filtro-aceite", sku: "MUE-5001", name: "Filtro de aceite de alta eficiencia",
    category: "filtros", brand: "Mann", price: 8.5, stock: 40,
    image: "/products/muestras/filtros-filtro-aceite.webp",
    desc: "Filtro con válvula antirretorno y medio filtrante de alta eficiencia para proteger el motor desde el arranque.",
    specs: { Rosca: "3/4-16 UNF", Altura: "95 mm", Válvula: "Antirretorno" },
  },
  {
    slug: "muestras-filtro-aire", sku: "MUE-5002", name: "Filtro de aire de panel",
    category: "filtros", brand: "Mann", price: 13.9, stock: 26,
    image: "/products/muestras/filtros-filtro-aire.webp",
    desc: "Filtro de panel que retiene polvo y partículas sin ahogar la admisión, para mantener el consumo.",
    specs: { Tipo: "Panel", Material: "Papel plisado", Marco: "Goma" },
    fits: [["Toyota", "Corolla", 2009, 2018]],
  },
  {
    slug: "muestras-faro-halogeno", sku: "MUE-6001", name: "Faro delantero halógeno con lente clara",
    category: "luces", brand: "Hella", price: 64, stock: 10,
    image: "/products/muestras/luces-faro-halogeno.webp",
    desc: "Faro delantero con reflector optimizado y lente resistente a rayaduras. Incluye portalámpara.",
    specs: { Lado: "Derecho", Casquillo: "H4", Lente: "Clara", Homologación: "E-mark" },
  },
  {
    slug: "muestras-bombillas-h4", sku: "MUE-6002", name: "Bombillas H4 luz blanca (par)",
    category: "luces", brand: "Osram", price: 21, stock: 24,
    image: "/products/muestras/luces-bombillas-h4.webp",
    desc: "Par de bombillas halógenas H4 con luz más blanca y alcance mejorado para carretera y ciudad.",
    specs: { Casquillo: "H4", Tensión: "12 V", Potencia: "60/55 W", Piezas: "2" },
  },
  {
    slug: "muestras-espejo-electrico", sku: "MUE-7001", name: "Espejo retrovisor eléctrico",
    category: "carroceria", brand: "Marca demo", price: 59, stock: 6,
    image: "/products/car-wing-mirror.webp",
    desc: "Espejo lateral con ajuste eléctrico, carcasa plegable y luna calefactable.",
    specs: { Ajuste: "Eléctrico", Lado: "Izquierdo", Carcasa: "Plegable", Luna: "Calefactable" },
  },
  {
    slug: "muestras-parachoques-delantero", sku: "MUE-7002", name: "Parachoques delantero listo para pintar",
    category: "carroceria", brand: "Marca demo", price: 195, stock: 3,
    image: "/products/car-bumper-front-national-exhibition.webp",
    desc: "Parachoques delantero de ABS con refuerzos y soportes incluidos. Se entrega sin pintar.",
    specs: { Material: "ABS", Acabado: "Sin pintar", Soportes: "Incluidos" },
  },
  {
    slug: "muestras-alfombrillas-goma", sku: "MUE-8001", name: "Alfombrillas de goma (juego 4)",
    category: "accesorios", brand: "Marca demo", price: 25, stock: 20,
    image: "/products/muestras/accesorios-alfombrillas.webp",
    desc: "Juego de cuatro alfombrillas moldeadas de goma antideslizante, fáciles de lavar y resistentes al uso diario.",
    specs: { Piezas: "4", Material: "Goma", Borde: "Antideslizante", Color: "Negro" },
  },
  {
    slug: "muestras-camara-tablero", sku: "MUE-8002", name: "Cámara de tablero Full HD",
    category: "accesorios", brand: "Marca demo", price: 49, stock: 15,
    image: "/products/muestras/accesorios-camara-reversa.webp",
    desc: "Cámara para salpicadero con grabación Full HD, visión nocturna y montaje por ventosa. Ideal para flotas.",
    specs: { Resolución: "1080p", Ángulo: "140°", Tarjeta: "Hasta 32 GB", Montaje: "Ventosa" },
  },
  {
    slug: "muestras-triciclo-carga", sku: "MUE-9001", name: "Triciclo eléctrico de carga 500 kg",
    category: "triciclos-electricos", brand: "Impacto EV", price: 1290, compareAt: 1450, stock: 3, featured: true,
    image: "/products/muestras/triciclos-carga-electrica.webp",
    desc: "Triciclo eléctrico con caja de carga, motor brushless y batería extraíble para reparto urbano.",
    specs: { Motor: "1000 W", Batería: "60 V / 45 Ah", "Carga útil": "500 kg", Autonomía: "70 km" },
  },
  {
    slug: "muestras-patinete-electrico", sku: "MUE-9002", name: "Patinete eléctrico urbano",
    category: "triciclos-electricos", brand: "Impacto EV", price: 445, stock: 8,
    image: "/products/muestras/triciclos-patinete-electrico.webp",
    desc: "Patinete plegable con motor de 350 W, freno eléctrico y luces LED para desplazamientos cortos.",
    specs: { Motor: "350 W", Autonomía: "30 km", "Velocidad máx.": "25 km/h", Peso: "12,5 kg" },
  },
];

const slugify = (s: string) => s.normalize("NFD").replace(/[\u0300-\u036f]/g, "").toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

async function main() {
  for (const m of MUESTRAS) {
    const cat = await prisma.category.upsert({ where: { slug: m.category }, update: {}, create: { slug: m.category, name: m.category.replace(/-/g, " ") } });
    const brand = await prisma.brand.upsert({ where: { slug: slugify(m.brand) }, update: {}, create: { slug: slugify(m.brand), name: m.brand } });
    const base = {
      name: m.name, sku: m.sku, categoryId: cat.id, brandId: brand.id,
      priceUsd: m.price, compareAtUsd: m.compareAt ?? null, images: [m.image],
      description: m.desc, specs: m.specs, featured: m.featured ?? false, active: true,
    };
    const row = await prisma.product.upsert({
      where: { slug: m.slug },
      update: base,
      create: { ...base, slug: m.slug, stock: m.stock },
    });
    if (m.fits?.length && !(await prisma.productFit.count({ where: { productId: row.id } })))
      await prisma.productFit.createMany({ data: m.fits.map(([make, model, yearFrom, yearTo]) => ({ productId: row.id, make, model, yearFrom, yearTo })) });
  }
  console.log(`Seed de muestras OK: ${MUESTRAS.length} productos con imágenes.`);
}

main().finally(() => prisma.$disconnect());
