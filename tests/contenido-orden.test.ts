import { describe, expect, it } from "vitest";
import { SECCIONES, type Seccion } from "@/lib/contenido";
import { ORDEN_WEB, grupoDe, ordenarSecciones } from "@/lib/contenido-orden";

const seccion = (key: string, label: string) => ({ key, label, descripcion: "", campos: [], defecto: {} } as Seccion);

describe("ordenarSecciones", () => {
  it("pone la portada antes que las páginas internas", () => {
    const entrada = [seccion("faq", "FAQ · preguntas"), seccion("portada-hero", "Portada · hero"), seccion("contacto-datos", "Contacto · datos")];
    expect(ordenarSecciones(entrada).map((s) => s.key)).toEqual(["portada-hero", "contacto-datos", "faq"]);
  });

  it("respeta el orden dentro de la misma página", () => {
    const entrada = [seccion("portada-cta", "Portada · cierre"), seccion("portada-hero", "Portada · hero"), seccion("portada-confianza", "Portada · franja")];
    expect(ordenarSecciones(entrada).map((s) => s.key)).toEqual(["portada-hero", "portada-confianza", "portada-cta"]);
  });

  it("deja al final las claves desconocidas, ordenadas por nombre", () => {
    const entrada = [seccion("zzz", "Zeta"), seccion("portada-hero", "Portada · hero"), seccion("aaa", "Alfa")];
    expect(ordenarSecciones(entrada).map((s) => s.key)).toEqual(["portada-hero", "aaa", "zzz"]);
  });

  it("no modifica la lista original", () => {
    const entrada = [seccion("faq", "FAQ · preguntas"), seccion("portada-hero", "Portada · hero")];
    ordenarSecciones(entrada);
    expect(entrada.map((s) => s.key)).toEqual(["faq", "portada-hero"]);
  });
});

describe("orden real de la web", () => {
  it("incluye todas las secciones declaradas", () => {
    const orden = new Set<string>(ORDEN_WEB);
    expect(SECCIONES.filter((s) => !orden.has(s.key)).map((s) => s.key)).toEqual([]);
  });

  it("empieza por la portada y termina por la configuración del carrito", () => {
    const lista = ordenarSecciones(SECCIONES);
    expect(lista[0].key).toBe("portada-hero");
    expect(lista.at(-1)?.key).toBe("carrito-config");
    expect(lista.some((s) => s.key === "facturacion")).toBe(true);
  });
});

describe("grupoDe", () => {
  it("usa la parte anterior al punto medio", () => {
    expect(grupoDe(seccion("faq", "FAQ · preguntas"))).toBe("FAQ");
  });

  it("devuelve General si no hay separador", () => {
    expect(grupoDe(seccion("suelta", "Suelta"))).toBe("Suelta");
  });
});
