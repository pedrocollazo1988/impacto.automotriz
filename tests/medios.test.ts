import { describe, expect, it } from "vitest";
import { MAX_FOTOGRAMAS_360, MAX_FOTOS, MAX_VIDEOS, esVideo, hayGiro360, huecosFotos, huecosVideos, mediosDeFicha, portadaDe, recortarMedios } from "@/lib/medios";

describe("esVideo", () => {
  it("reconoce mp4 y webm, también con parámetros", () => {
    for (const u of ["/media/a.mp4", "/media/a.webm", "https://x.com/a.MP4", "/a.mp4?v=2", "/a.webm#t=1"]) expect(esVideo(u)).toBe(true);
  });

  it("no confunde fotos ni modelos con vídeo", () => {
    for (const u of ["/a.jpg", "/a.webp", "/a.glb", "/a.gltf", "/a.png", ""]) expect(esVideo(u)).toBe(false);
  });
});

describe("mediosDeFicha", () => {
  it("pone las fotos antes que los vídeos", () => {
    const m = mediosDeFicha(["/a.jpg", "/b.jpg"], ["/v.mp4"]);
    expect(m.map((x) => x.tipo)).toEqual(["foto", "foto", "video"]);
    expect(m[2].url).toBe("/v.mp4");
  });

  it("descarta huecos vacíos", () => {
    expect(mediosDeFicha(["/a.jpg", ""], ["", "/v.mp4"])).toHaveLength(2);
  });

  it("sin nada devuelve lista vacía, para que la galería ponga el marcador", () => {
    expect(mediosDeFicha()).toEqual([]);
  });
});

describe("límites", () => {
  it("cinco fotos, tres vídeos", () => {
    expect(MAX_FOTOS).toBe(5);
    expect(MAX_VIDEOS).toBe(3);
  });

  it("los huecos bajan al añadir y nunca son negativos", () => {
    expect(huecosFotos([])).toBe(5);
    expect(huecosFotos(["/a", "/b"])).toBe(3);
    expect(huecosFotos(["/1", "/2", "/3", "/4", "/5", "/6"])).toBe(0);
    expect(huecosVideos([])).toBe(3);
  });

  it("recortar conserva el orden y corta por el final", () => {
    expect(recortarMedios(["/1", "/2", "/3", "/4"], 2)).toEqual(["/1", "/2"]);
    expect(recortarMedios(["/1"], 5)).toEqual(["/1"]);
    expect(recortarMedios([], 5)).toEqual([]);
  });
});

describe("hayGiro360", () => {
  it("con vídeo hay giro aunque no haya fotogramas", () => {
    expect(hayGiro360([], "/g.mp4")).toBe(true);
  });

  it("con fotogramas suficientes hay giro", () => {
    expect(hayGiro360(Array(MAX_FOTOGRAMAS_360).fill("/f.webp"))).toBe(true);
  });

  it("con pocos fotogramas no: girar dos fotos no es un 360", () => {
    expect(hayGiro360(["/a.webp", "/b.webp"])).toBe(false);
    expect(hayGiro360([])).toBe(false);
  });
});

describe("portadaDe", () => {
  it("usa la primera foto como póster del 3D", () => {
    expect(portadaDe(["/a.jpg"], ["/v.mp4"])).toBe("/a.jpg");
  });

  it("sin fotos no hay póster", () => {
    expect(portadaDe([], ["/v.mp4"])).toBeUndefined();
  });
});
