import { readFileSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";
import { PARTS } from "@/lib/despiece-seed";

// La lámina dibuja su propia insignia numerada (círculo navy r=13 + número blanco)
// dentro de un grupo `sheet-body` que va desplazado y escalado. El pin interactivo
// debe caer sobre la insignia ya transformada, tal como la ve el visitante: si se
// desalinea, el cliente toca un número y resalta otro sitio.
const LAMINA_ANCHO = 1200;
const LAMINA_ALTO = 800;
const TOLERANCIA_PORCENTAJE = 0.5;

const leerLamina = (sistema: string) =>
  readFileSync(join(process.cwd(), "public", "despiece", `${sistema}.svg`), "utf8");

const transformDelCuerpo = (svg: string) => {
  const m = /id="sheet-body"[^>]*transform="translate\(([-\d.]+)\s+([-\d.]+)\)\s*scale\(([\d.]+)\)"/.exec(svg);
  if (!m) return { tx: 0, ty: 0, escala: 1 };
  return { tx: Number(m[1]), ty: Number(m[2]), escala: Number(m[3]) };
};

const insigniasDibujadas = (sistema: string) => {
  const svg = leerLamina(sistema);
  const { tx, ty, escala } = transformDelCuerpo(svg);
  const patron = /<circle\s+cx="([\d.]+)"\s+cy="([\d.]+)"\s+r="13"\s+fill="#0b2a5b"\s*\/>\s*<text[^>]*>\s*(\d+)\s*<\/text>/g;
  const salida = new Map<number, { x: number; y: number }>();
  for (const [, cx, cy, numero] of svg.matchAll(patron)) {
    salida.set(Number(numero), {
      x: ((Number(cx) * escala + tx) / LAMINA_ANCHO) * 100,
      y: ((Number(cy) * escala + ty) / LAMINA_ALTO) * 100,
    });
  }
  return salida;
};

const sistemas = [...new Set(PARTS.map((p) => p.system))];

describe("despiece: los pines caen sobre su número en la lámina", () => {
  it.each(sistemas)("%s dibuja una insignia por cada pieza", (sistema) => {
    const piezas = PARTS.filter((p) => p.system === sistema);
    const insignias = insigniasDibujadas(sistema);
    expect(piezas.length).toBeGreaterThan(0);
    for (const pieza of piezas) {
      expect(insignias.has(pieza.number), `la lámina ${sistema} no dibuja el número ${pieza.number}`).toBe(true);
    }
  });

  it.each(sistemas)("%s coloca cada pin sobre el centro de su insignia", (sistema) => {
    const insignias = insigniasDibujadas(sistema);
    for (const pieza of PARTS.filter((p) => p.system === sistema)) {
      const insignia = insignias.get(pieza.number)!;
      const desvio = Math.hypot(pieza.x - insignia.x, pieza.y - insignia.y);
      expect(
        desvio,
        `pin ${pieza.sku} (número ${pieza.number}) está a ${desvio.toFixed(2)}% de su insignia en ${sistema}`,
      ).toBeLessThanOrEqual(TOLERANCIA_PORCENTAJE);
    }
  });

  it("cada pieza apunta a un grupo que la lámina sí dibuja", () => {
    for (const pieza of PARTS) {
      expect(leerLamina(pieza.system)).toContain(`id="${pieza.svgId}"`);
    }
  });

  it.each(sistemas)("%s dibuja sus insignias dentro del lienzo visible", (sistema) => {
    for (const [numero, { x, y }] of insigniasDibujadas(sistema)) {
      expect(x, `la insignia ${numero} de ${sistema} se sale por la izquierda o la derecha`).toBeGreaterThanOrEqual(0);
      expect(x, `la insignia ${numero} de ${sistema} se sale por la izquierda o la derecha`).toBeLessThanOrEqual(100);
      expect(y, `la insignia ${numero} de ${sistema} se sale por arriba o por abajo`).toBeGreaterThanOrEqual(0);
      expect(y, `la insignia ${numero} de ${sistema} se sale por arriba o por abajo`).toBeLessThanOrEqual(100);
    }
  });
});
