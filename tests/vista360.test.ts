import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { tieneVista360 } from "@/lib/vista360";
import { fotos360, skusConGiro } from "@/lib/photo360";

describe("tieneVista360", () => {
  it("solo en la categoría de vehículos eléctricos", () => {
    expect(tieneVista360("triciclos-electricos")).toBe(true);
  });
  it("no en repuestos ni categorías vacías", () => {
    for (const c of ["motor", "frenos", "repuestos", "electrico", null, undefined, ""]) expect(tieneVista360(c)).toBe(false);
  });
});

describe("fotos360", () => {
  const original = process.cwd();
  afterEach(() => process.chdir(original));

  const montar = (sku: string, cuantas: number) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "f360-"));
    fs.mkdirSync(path.join(dir, "public", "products", "360"), { recursive: true });
    for (let n = 1; n <= cuantas; n++) {
      fs.writeFileSync(path.join(dir, "public", "products", "360", `${sku}-${String(n).padStart(2, "0")}.webp`), "");
    }
    process.chdir(dir);
  };

  it("devuelve la secuencia ordenada", () => {
    montar("te-4001", 12);
    const f = fotos360("TE-4001");
    expect(f).toHaveLength(12);
    expect(f[0]).toBe("/products/360/te-4001-01.webp");
    expect(f[11]).toBe("/products/360/te-4001-12.webp");
  });
  it("descarta secuencias demasiado cortas", () => {
    montar("te-4002", 3);
    expect(fotos360("TE-4002")).toEqual([]);
  });
  it("lista solo los SKU con secuencia completa", () => {
    montar("te-4001", 10);
    for (let n = 1; n <= 10; n++) fs.writeFileSync(path.join(process.cwd(), "public", "products", "360", `te-4002-${String(n).padStart(2, "0")}.webp`), "");
    fs.writeFileSync(path.join(process.cwd(), "public", "products", "360", "te-4003-01.webp"), "");
    expect(skusConGiro().sort()).toEqual(["TE-4001", "TE-4002"]);
  });

  it("sin fotos no hay secuencia", () => {
    montar("te-4003", 0);
    expect(fotos360("TE-4003")).toEqual([]);
    expect(fotos360(null)).toEqual([]);
  });
});

// La secuencia real del repositorio: si alguien borra o renombra fotogramas, el
// giro de la ficha se apaga sin avisar y el fallo solo se ve en producción.
describe("secuencia 360 publicada", () => {
  it("los tres eléctricos giran con 36 fotogramas", () => {
    const dir = path.join(process.cwd(), "public", "products", "360");
    for (const sku of ["te-4001", "te-4002", "te-4003"]) {
      const f = fotos360(sku);
      expect(f, `${sku} sin secuencia`).toHaveLength(36);
      for (const ruta of f) expect(fs.existsSync(path.join(dir, path.basename(ruta)))).toBe(true);
    }
    expect(skusConGiro().sort()).toEqual(["TE-4001", "TE-4002", "TE-4003"]);
  });

  it("cada fotograma es un WebP real y no un fichero vacio", () => {
    const dir = path.join(process.cwd(), "public", "products", "360");
    for (const f of fotos360("TE-4001")) {
      const buf = fs.readFileSync(path.join(dir, path.basename(f)));
      expect(buf.subarray(0, 4).toString("ascii")).toBe("RIFF");
      expect(buf.subarray(8, 12).toString("ascii")).toBe("WEBP");
      expect(buf.length).toBeGreaterThan(500);
    }
  });
});
