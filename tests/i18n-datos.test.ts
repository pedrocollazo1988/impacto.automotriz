import { describe, expect, it } from "vitest";
import { PARTS, SYSTEMS } from "@/lib/despiece-seed";
import { etiquetaPiezaDeFabrica, productoDeFabrica, sistemaDeFabrica } from "@/lib/catalogo-en";
import { enContenido } from "@/lib/contenido-en";
import { etiquetaPieza, nombreCategoria, nombreMarca, nombreProducto, resumenVehiculo, versionVehiculo } from "@/lib/datos-i18n";

// El despiece es contenido de demostración sin campos en inglés en la base:
// si una pieza nueva no entra en el diccionario, el visitante en inglés ve
// español a media página. Estas comprobaciones lo detectan antes del despliegue.
describe("traducciones de fábrica del despiece", () => {
  it("cada pieza del seed tiene nombre, descripción y etiqueta en inglés", () => {
    const sinTraduccion = PARTS.filter((p) => {
      const t = productoDeFabrica({ sku: p.sku, name: p.name });
      return !t || !t.name || !t.description;
    });
    expect(sinTraduccion.map((p) => p.sku)).toEqual([]);
  });

  it("la etiqueta del pin se traduce y solo si el nombre coincide", () => {
    const pieza = PARTS[0];
    expect(etiquetaPiezaDeFabrica({ sku: pieza.sku, name: pieza.name })).toBeTruthy();
    expect(etiquetaPiezaDeFabrica({ sku: pieza.sku, name: "Nombre cambiado" })).toBeUndefined();
  });

  it("los siete sistemas tienen nombre inglés", () => {
    expect(SYSTEMS).toHaveLength(7);
    for (const s of SYSTEMS) {
      expect(sistemaDeFabrica(s.slug), s.slug).toBeTruthy();
      expect(enContenido(s.name, "en"), s.slug).not.toBe(s.name);
      expect(enContenido(s.blurb, "en"), s.slug).not.toBe(s.blurb);
    }
  });
});

describe("respaldo al español", () => {
  it("un producto que no está en el diccionario se queda como está", () => {
    const p = { slug: "pieza-nueva-del-negocio", sku: "NUEVO-01", name: "Pieza nueva" };
    expect(productoDeFabrica(p)).toBeUndefined();
    expect(nombreProducto(p, "en")).toBe("Pieza nueva");
  });

  it("el nombre escrito en el panel manda sobre el de fábrica", () => {
    const p = { slug: "pieza-renombrada", name: PARTS[0].name, nameEn: "Custom name" };
    expect(nombreProducto(p, "en")).toBe("Custom name");
  });

  it("en español nunca se usa la traducción", () => {
    const p = { slug: "pastillas-freno-delanteras", name: "Pastillas de freno delanteras" };
    expect(nombreProducto(p, "es")).toBe("Pastillas de freno delanteras");
  });

  it("categoría y marca caen al español si no hay inglés", () => {
    expect(nombreCategoria({ name: "Categoría rara " }, "en")).toBe("Categoría rara ");
    expect(nombreMarca({ name: "Marca rara" }, "en")).toBe("Marca rara");
  });

  it("la etiqueta de la pieza cae al texto de la base", () => {
    expect(etiquetaPieza({ sku: "OTRO-01", name: "Pieza", label: "ABC" }, "en")).toBe("ABC");
    expect(etiquetaPieza({ sku: "OTRO-01", name: "Pieza" }, "en")).toBe("Pieza");
  });
});

// El catálogo real (prisma/seed-reales.ts) tiene nombres con marca y
// referencia ("Pastillas de freno delanteras Brembo P85020"), así que el
// emparejamiento por nombre no sirve: se traduce por SKU.
describe("traducciones del catálogo real", () => {
  const reales = [
    ["IMP-FRE-1001", "pastillas-freno-brembo-p85020", "Pastillas de freno delanteras Brembo P85020"],
    ["IMP-FRE-1002", "discos-freno-bosch-0986479237", "Discos de freno ventilados Bosch 0 986 479 237 (par)"],
    ["IMP-FIL-2001", "filtro-aceite-mann-w71275", "Filtro de aceite Mann-Filter W 712/75"],
    ["IMP-ELE-3001", "bateria-varta-blue-dynamic-d24-60ah", "Batería Varta Blue Dynamic D24 12V 60Ah"],
    ["IMP-ELE-3004", "bujias-ngk-bkr6eix11-iridio", "Bujías NGK BKR6EIX-11 de iridio (juego 4)"],
    ["IMP-SUS-4003", "rotula-suspension-moog-k90344", "Rótula de suspensión Moog K90344"],
    ["IMP-LUC-6002", "bombillas-osram-night-breaker-200-h4", "Bombillas Osram Night Breaker 200 H4 (par)"],
    ["IMP-TRI-8001", "triciclo-electrico-carga-500kg", "Triciclo eléctrico de carga 500 kg"],
    ["IMP-TRI-8002", "patinete-electrico-urbano-350w", "Patinete eléctrico urbano 350 W"],
  ] as const;

  it("cada ficha real se traduce por su SKU", () => {
    for (const [sku, slug, name] of reales) {
      const t = productoDeFabrica({ sku, slug, name });
      expect(t, sku).toBeDefined();
      expect(t!.name, sku).not.toBe(name);
      expect(t!.description.length, sku).toBeGreaterThan(40);
    }
  });

  it("conserva marca y referencia en el nombre inglés", () => {
    expect(nombreProducto({ sku: "IMP-FRE-1001", slug: "x", name: "Pastillas de freno delanteras Brembo P85020" }, "en"))
      .toBe("Front Brake Pads Brembo P85020");
  });

  it("sigue traduciendo si el negocio renombra la ficha desde el panel", () => {
    expect(nombreProducto({ sku: "IMP-FIL-2001", slug: "filtro-x", name: "Filtro de aceite (oferta)" }, "en"))
      .toBe("Oil Filter Mann-Filter W 712/75");
  });

  it("acepta el nombre acortado del producto de ejemplo", () => {
    expect(nombreProducto({ slug: "triciclo-electrico-cargo", name: "Triciclo eléctrico de carga" }, "en").toLowerCase())
      .toContain("tricycle");
  });
});

describe("vehículo del despiece", () => {
  it("traduce versión y resumen por slug", () => {
    const v = { slug: "kvitova-dds-od", version: "Eléctrico", summary: "Triciclo eléctrico de carga con tolva." };
    expect(versionVehiculo(v, "en")).toBe("Electric");
    expect(resumenVehiculo(v, "en")).toMatch(/^Electric cargo tricycle/);
    expect(versionVehiculo(v, "es")).toBe("Eléctrico");
    expect(resumenVehiculo(v, "es")).toBe("Triciclo eléctrico de carga con tolva.");
  });

  it("usa la columna inglesa si el negocio la rellena", () => {
    const v = { slug: "otro", version: "Eléctrico", versionEn: "Battery", summary: "x", summaryEn: "Custom" };
    expect(versionVehiculo(v, "en")).toBe("Battery");
    expect(resumenVehiculo(v, "en")).toBe("Custom");
  });

  it("traduce versiones conocidas de vehículos nuevos", () => {
    expect(versionVehiculo({ slug: "nuevo", version: "Gasolina" }, "en")).toBe("Petrol");
    expect(versionVehiculo({ slug: "nuevo", version: "Diésel" }, "en")).toBe("Diésel");
  });
});
