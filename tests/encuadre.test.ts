import { describe, expect, it } from "vitest";
import { cajaComun, cajaObjeto, centro, fondoBorde, ordenNatural } from "@/lib/encuadre";

// Lienzo sintetico: fondo gris claro con un rectangulo oscuro dentro.
function lienzo(w: number, h: number, rect: { x0: number; y0: number; x1: number; y1: number }, fondo = [232, 235, 239]) {
  const data = new Uint8Array(w * h * 3);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = (y * w + x) * 3;
      const dentro = x >= rect.x0 && x < rect.x1 && y >= rect.y0 && y < rect.y1;
      data[i] = dentro ? 11 : fondo[0];
      data[i + 1] = dentro ? 42 : fondo[1];
      data[i + 2] = dentro ? 91 : fondo[2];
    }
  }
  return data;
}

describe("fondoBorde", () => {
  it("toma el color del anillo exterior, no del centro", () => {
    const d = lienzo(100, 100, { x0: 20, y0: 20, x1: 80, y1: 80 });
    expect(fondoBorde(d, 100, 100, 3)).toEqual([232, 235, 239]);
  });
});

describe("cajaObjeto", () => {
  it("encuentra la silueta y la devuelve en proporciones", () => {
    const d = lienzo(100, 100, { x0: 25, y0: 40, x1: 75, y1: 90 });
    const c = cajaObjeto(d, 100, 100, 3)!;
    expect(c.x0).toBeCloseTo(0.25, 2);
    expect(c.y0).toBeCloseTo(0.4, 2);
    expect(c.x1).toBeCloseTo(0.75, 2);
    expect(c.y1).toBeCloseTo(0.9, 2);
  });

  it("ignora una mota suelta y se queda con el producto", () => {
    const d = lienzo(100, 100, { x0: 20, y0: 20, x1: 70, y1: 70 });
    // Mota de 3x3 en la esquina opuesta.
    for (let y = 95; y < 98; y++) for (let x = 95; x < 98; x++) {
      const i = (y * 100 + x) * 3;
      d[i] = 11; d[i + 1] = 42; d[i + 2] = 91;
    }
    const c = cajaObjeto(d, 100, 100, 3)!;
    expect(c.x0).toBeCloseTo(0.2, 2);
    expect(c.x1).toBeCloseTo(0.7, 2);
  });

  it("sin nada que destacar devuelve null", () => {
    const d = lienzo(100, 100, { x0: 0, y0: 0, x1: 0, y1: 0 });
    expect(cajaObjeto(d, 100, 100, 3)).toBeNull();
  });
});

describe("cajaComun", () => {
  it("abarca el producto en todas las posiciones y sale cuadrada", () => {
    const cajas = [
      { x0: 0.2, y0: 0.3, x1: 0.6, y1: 0.7 },
      { x0: 0.35, y0: 0.28, x1: 0.8, y1: 0.72 },
    ];
    const c = cajaComun(cajas, 400, 400, 0.1);
    const ancho = c.x1 - c.x0;
    const alto = c.y1 - c.y0;
    expect(ancho).toBeCloseTo(alto, 6); // cuadrada en pixeles
    // Contiene la union de las dos siluetas.
    expect(c.x0).toBeLessThanOrEqual(0.2 * 400);
    expect(c.x1).toBeGreaterThanOrEqual(0.8 * 400);
    expect(c.y0).toBeLessThanOrEqual(0.28 * 400);
    expect(c.y1).toBeGreaterThanOrEqual(0.72 * 400);
  });

  it("en un lienzo no cuadrado sigue siendo cuadrada en pixeles", () => {
    const c = cajaComun([{ x0: 0.4, y0: 0.2, x1: 0.6, y1: 0.8 }], 1200, 600, 0.1);
    expect(c.x1 - c.x0).toBeCloseTo(c.y1 - c.y0, 6);
  });

  it("nunca se sale del lienzo", () => {
    const c = cajaComun([{ x0: 0.01, y0: 0.01, x1: 0.99, y1: 0.99 }], 300, 300, 0.2);
    expect(c.x0).toBeGreaterThanOrEqual(0);
    expect(c.y0).toBeGreaterThanOrEqual(0);
    expect(c.x1).toBeLessThanOrEqual(300);
    expect(c.y1).toBeLessThanOrEqual(300);
  });

  it("sin cajas usa el cuadrado mayor centrado", () => {
    const c = cajaComun([], 1200, 600, 0.1);
    expect(c.x1 - c.x0).toBeCloseTo(600, 6);
    expect((c.x0 + c.x1) / 2).toBeCloseTo(600, 6);
  });
});

describe("centro", () => {
  it("calcula el punto medio y el area", () => {
    const c = centro({ x0: 0.2, y0: 0.4, x1: 0.6, y1: 0.8 });
    expect(c.x).toBeCloseTo(0.4, 6);
    expect(c.y).toBeCloseTo(0.6, 6);
    expect(c.area).toBeCloseTo(0.16, 6);
  });
});

describe("ordenNatural", () => {
  it("numera como una persona: foto2 antes que foto10", () => {
    const nombres = ["foto10.jpg", "foto2.jpg", "foto1.jpg", "foto20.jpg"];
    expect(nombres.sort(ordenNatural)).toEqual(["foto1.jpg", "foto2.jpg", "foto10.jpg", "foto20.jpg"]);
  });

  it("no le afectan mayusculas ni extensiones distintas", () => {
    const nombres = ["TOMA_03.HEIC", "toma_1.jpg", "Toma_02.png"];
    expect(nombres.sort(ordenNatural)).toEqual(["toma_1.jpg", "Toma_02.png", "TOMA_03.HEIC"]);
  });
});
