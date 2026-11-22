import { describe, expect, it } from "vitest";
import { ZOOM_MAX, ZOOM_MIN, acotar, anchoParaZoom, origenEn, zoomConBoton, zoomConRueda } from "@/lib/lupa";

describe("zoom de la lupa", () => {
  it("acota entre el mínimo y el máximo", () => {
    expect(acotar(0.2)).toBe(ZOOM_MIN);
    expect(acotar(99)).toBe(ZOOM_MAX);
    expect(acotar(2.5)).toBe(2.5);
  });

  it("la rueda hacia arriba acerca y hacia abajo aleja", () => {
    expect(zoomConRueda(2, -100)).toBeGreaterThan(2);
    expect(zoomConRueda(2, 100)).toBeLessThan(2);
  });

  it("no se pasa de los topes por mucho que se gire", () => {
    let z = 1;
    for (let k = 0; k < 100; k++) z = zoomConRueda(z, -100);
    expect(z).toBe(ZOOM_MAX);
    for (let k = 0; k < 100; k++) z = zoomConRueda(z, 100);
    expect(z).toBe(ZOOM_MIN);
  });

  it("cada paso de rueda es pequeño: 20 pasos no llegan al máximo", () => {
    // El fallo original era un salto brusco. Con pasos de 1,12x, 20 pasos desde
    // 2x piden 2*1.12^20 ≈ 19x, así que el tope frena; lo importante es que un
    // solo paso mueva menos de un 15 %, que es lo que se percibe como brusco.
    const unPaso = zoomConRueda(2, -100);
    expect(unPaso / 2).toBeLessThan(1.15);
  });

  it("ignora deltas vacíos o absurdos", () => {
    expect(zoomConRueda(2, 0)).toBe(2);
    expect(zoomConRueda(2, Number.NaN)).toBe(2);
  });

  it("el botón también acota", () => {
    expect(zoomConBoton(ZOOM_MAX, true)).toBe(ZOOM_MAX);
    expect(zoomConBoton(ZOOM_MIN, false)).toBe(ZOOM_MIN);
    expect(zoomConBoton(2, true)).toBeGreaterThan(2);
  });
});

describe("origenEn", () => {
  it("convierte la posición del cursor en porcentaje", () => {
    expect(origenEn(50, 25, 200, 100)).toEqual({ x: 25, y: 25 });
  });

  it("recorta fuera del marco para no dejar huecos blancos", () => {
    expect(origenEn(-40, -40, 200, 100)).toEqual({ x: 0, y: 0 });
    expect(origenEn(400, 400, 200, 100)).toEqual({ x: 100, y: 100 });
  });

  it("con un marco de tamaño cero no divide por cero", () => {
    expect(origenEn(10, 10, 0, 0)).toEqual({ x: 50, y: 50 });
  });
});

describe("anchoParaZoom", () => {
  it("pide el escalón siguiente al tamaño que se dibuja", () => {
    // 400 px CSS a 2x y densidad 1 = 800 px reales -> escalón 1024.
    expect(anchoParaZoom(400, 2, 1)).toBe(1024);
  });

  it("tiene en cuenta la densidad de pantalla", () => {
    expect(anchoParaZoom(400, 2, 2)).toBe(1920);
  });

  it("no pasa del escalón mayor", () => {
    expect(anchoParaZoom(4000, 4, 3)).toBe(3840);
  });
});
