import { describe, expect, it } from "vitest";
import { envolver, iniciarArrastre, pasosDeArrastre } from "@/lib/arrastre";

describe("pasosDeArrastre", () => {
  it("un arrastre de 140 px avanza 14 fotogramas, no mas", () => {
    // El fallo original medía contra el punto de partida, así que el
    // desplazamiento se acumulaba y esto daba 105.
    let e = iniciarArrastre(500);
    let total = 0;
    for (let k = 1; k <= 14; k++) {
      const r = pasosDeArrastre(e, 500 + k * 10);
      e = r.estado;
      total += r.pasos;
    }
    expect(total).toBe(14);
  });

  it("arrastrar a la izquierda retrocede", () => {
    let e = iniciarArrastre(500);
    let total = 0;
    for (let k = 1; k <= 14; k++) {
      const r = pasosDeArrastre(e, 500 - k * 10);
      e = r.estado;
      total += r.pasos;
    }
    expect(total).toBe(-14);
  });

  it("un movimiento menor de 10 px no cambia de fotograma", () => {
    const e = iniciarArrastre(500);
    expect(pasosDeArrastre(e, 504).pasos).toBe(0);
  });

  it("los restos se suman entre llamadas", () => {
    let e = iniciarArrastre(0);
    const a = pasosDeArrastre(e, 6); // 6 px: nada todavia
    e = a.estado;
    expect(a.pasos).toBe(0);
    const b = pasosDeArrastre(e, 12); // 12 px acumulados: un fotograma
    expect(b.pasos).toBe(1);
  });

  it("el resto se conserva para el siguiente tramo", () => {
    let e = iniciarArrastre(0);
    const a = pasosDeArrastre(e, 25); // 2 fotogramas y 5 px de resto
    e = a.estado;
    expect(a.pasos).toBe(2);
    const b = pasosDeArrastre(e, 30); // 5 de resto + 5 nuevos = 10 -> 1 fotograma
    expect(b.pasos).toBe(1);
    expect(b.estado.resto).toBe(0);
  });
});

describe("envolver", () => {
  it("da la vuelta en los dos sentidos", () => {
    expect(envolver(36, 36)).toBe(0);
    expect(envolver(-1, 36)).toBe(35);
    expect(envolver(37, 36)).toBe(1);
    expect(envolver(-37, 36)).toBe(35);
  });

  it("sin fotogramas devuelve 0", () => {
    expect(envolver(5, 0)).toBe(0);
  });
});
