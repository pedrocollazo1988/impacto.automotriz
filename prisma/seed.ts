// Ejecutar: npx tsx prisma/seed.ts
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
  const [frenos, electrico, suspension, triciclos] = await Promise.all([cat("frenos", "Frenos"), cat("electrico", "Sistema eléctrico"), cat("suspension", "Suspensión"), cat("triciclos-electricos", "Triciclos eléctricos")]);
  const brand = await prisma.brand.upsert({ where: { slug: "marca-demo" }, update: {}, create: { slug: "marca-demo", name: "Marca demo" } });
  const demo = [
    { slug: "pastillas-freno-delanteras", sku: "DEMO-001", name: "Pastillas de freno delanteras", categoryId: frenos.id, priceUsd: 25, stock: 12, featured: true, fits: [["Toyota", "Corolla", 2010, 2018]] },
    { slug: "amortiguador-trasero", sku: "DEMO-002", name: "Amortiguador trasero", categoryId: suspension.id, priceUsd: 40, stock: 8, featured: true, fits: [["Hyundai", "Accent", 2008, 2016]] },
    { slug: "bateria-12v-60ah", sku: "DEMO-003", name: "Batería 12V 60Ah", categoryId: electrico.id, priceUsd: 85, stock: 5, featured: false, fits: [] },
    { slug: "triciclo-electrico-cargo", sku: "DEMO-004", name: "Triciclo eléctrico de carga", categoryId: triciclos.id, priceUsd: 1200, stock: 2, featured: true, fits: [],
      model3dUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb" }, // modelo de ejemplo del visor
  ];
  for (const { fits, ...p } of demo) {
    const row = await prisma.product.upsert({ where: { slug: p.slug }, update: {}, create: { ...p, brandId: brand.id, images: ["/placeholder.svg"], description: "Producto de demostración." } });
    if (fits.length && !(await prisma.productFit.count({ where: { productId: row.id } })))
      await prisma.productFit.createMany({ data: fits.map(([make, model, yearFrom, yearTo]) => ({ productId: row.id, make: make as string, model: model as string, yearFrom: yearFrom as number, yearTo: yearTo as number })) });
  }
  console.log("Seed OK: 16 provincias, 168 municipios, métodos de entrega.");
}
main().finally(() => prisma.$disconnect());
