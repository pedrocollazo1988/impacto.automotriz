import { describe, expect, it } from "vitest";
import { buscarSeccion, componer, limpiarItems, SECCIONES } from "@/lib/contenido";

describe("catálogo de secciones", () => {
  it("no repite claves", () => {
    const claves = SECCIONES.map((s) => s.key);
    expect(new Set(claves).size).toBe(claves.length);
  });

  it("cada sección trae texto de fábrica suficiente para pintarse sola", () => {
    for (const s of SECCIONES) {
      const tieneTexto = !!(s.defecto.title || s.defecto.subtitle);
      const tieneItems = (s.defecto.items?.length ?? 0) > 0;
      expect(tieneTexto || tieneItems, `${s.key} no tiene nada con lo que pintarse`).toBe(true);
    }
  });

  it("los campos de encabezado usan las claves que guarda la API", () => {
    for (const s of SECCIONES) {
      for (const c of s.campos) expect(["eyebrow", "title", "subtitle"], `${s.key}: ${c.key}`).toContain(c.key);
    }
  });

  it("los campos de elemento usan las claves que guarda la API", () => {
    for (const s of SECCIONES) {
      for (const c of s.camposItem ?? []) expect(["icono", "titulo", "texto", "href"], `${s.key}: ${c.key}`).toContain(c.key);
    }
  });

  it("los elementos de fábrica tienen título, para que sirvan de clave", () => {
    for (const s of SECCIONES) {
      for (const it of s.defecto.items ?? []) expect(it.titulo, `${s.key}`).toBeTruthy();
    }
  });

  it("ningún valor de fábrica supera el máximo de su sección", () => {
    for (const s of SECCIONES) {
      if (s.maxItems) expect((s.defecto.items?.length ?? 0) <= s.maxItems, s.key).toBe(true);
    }
  });

  it("busca por clave y devuelve undefined si no existe", () => {
    expect(buscarSeccion("faq")?.key).toBe("faq");
    expect(buscarSeccion("no-existe")).toBeUndefined();
  });
});

describe("limpiarItems", () => {
  it("descarta elementos sin título ni texto", () => {
    expect(limpiarItems([{ titulo: "A" }, { icono: "box" }, null, "x"])).toHaveLength(1);
  });

  it("recorta al máximo indicado", () => {
    const muchos = Array.from({ length: 10 }, (_, i) => ({ titulo: `T${i}` }));
    expect(limpiarItems(muchos, 3)).toHaveLength(3);
  });

  it("trunca textos desmedidos en vez de rechazar el guardado", () => {
    const [it] = limpiarItems([{ titulo: "x".repeat(500), texto: "y".repeat(5000) }]);
    expect(it.titulo!.length).toBe(300);
    expect(it.texto!.length).toBe(2000);
  });

  it("acepta cualquier cosa sin romperse", () => {
    for (const v of [null, undefined, 42, "texto", {}, []]) expect(limpiarItems(v)).toEqual([]);
  });
});

describe("componer", () => {
  const faq = buscarSeccion("faq")!;

  it("sin fila devuelve el texto de fábrica", () => {
    const b = componer(faq, null);
    expect(b.title).toBe(faq.defecto.title);
    expect(b.items).toHaveLength(faq.defecto.items!.length);
    expect(b.visible).toBe(true);
  });

  it("lo guardado gana sobre el texto de fábrica", () => {
    const b = componer(faq, { eyebrow: "Ey", title: "Título nuevo", subtitle: "Sub", items: [{ titulo: "¿P?", texto: "R" }], visible: true });
    expect(b.title).toBe("Título nuevo");
    expect(b.items).toEqual([{ icono: undefined, titulo: "¿P?", texto: "R", href: undefined }]);
  });

  it("un campo vacío no borra el texto de fábrica", () => {
    const b = componer(faq, { eyebrow: "", title: "", subtitle: "", items: [], visible: true });
    expect(b.title).toBe(faq.defecto.title);
    expect(b.items).toHaveLength(faq.defecto.items!.length);
  });

  it("respeta el ocultado aunque haya contenido", () => {
    const b = componer(faq, { eyebrow: "", title: "X", subtitle: "", items: [{ titulo: "A", texto: "B" }], visible: false });
    expect(b.visible).toBe(false);
  });

  it("una lista vacía guardada a propósito no deja la sección sin elementos", () => {
    // limpiarItems descarta los vacíos, así que "guardé una lista vacía" equivale
    // a "no hay nada guardado" y se vuelve al texto de fábrica.
    const b = componer(faq, { eyebrow: "", title: "", subtitle: "", items: [{ titulo: "" }], visible: true });
    expect(b.items.length).toBe(faq.defecto.items!.length);
  });
});
