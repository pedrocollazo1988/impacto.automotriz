import { describe, expect, it } from "vitest";
import { PARTS, SYSTEMS } from "@/lib/despiece-seed";
import { etiquetaPiezaDeFabrica, productoDeFabrica, sistemaDeFabrica } from "@/lib/catalogo-en";
import { enContenido } from "@/lib/contenido-en";
import { etiquetaPieza, nombreCategoria, nombreMarca, nombreProducto } from "@/lib/datos-i18n";

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
