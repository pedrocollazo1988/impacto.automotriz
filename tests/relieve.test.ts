import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { afterEach, describe, expect, it } from "vitest";
import { tieneVista360 } from "@/lib/vista360";
import { relieveDe, rutaRelieve, skusConRelieve } from "@/lib/relieve";

const MAPAS = ["color.webp", "profundidad.webp", "recorte.webp"];

describe("tieneVista360", () => {
  it("solo en la categoría de vehículos eléctricos", () => {
    expect(tieneVista360("tricliclos-electricos")).toBe(false);
    expect(tieneVista360("triciclos-electricos")).toBe(true);
  });
  it("no en repuestos ni categorías vacías", () => {
    for (const c of ["motor", "frenos", "repuestos", "electrico", null, undefined, ""]) expect(tieneVista360(c)).toBe(false);
  });
});

describe("relieve", () => {
  const original = process.cwd();
  afterEach(() => process.chdir(original));

  // Monta un árbol temporal con los mapas de un SKU.
  const montar = (sku: string, opts: { mapas?: string[]; meta?: object | null } = {}) => {
    const dir = fs.mkdtempSync(path.join(os.tmpdir(), "relieve-"));
    const d = path.join(dir, "public", "products", "relieve", sku.toLowerCase());
    fs.mkdirSync(d, { recursive: true });
    for (const m of opts.mapas ?? MAPAS) fs.writeFileSync(path.join(d, m), "");
    if (opts.meta !== null) {
      fs.writeFileSync(path.join(d, "meta.json"), JSON.stringify(opts.meta ?? { sku: sku.toUpperCase(), anguloMax: 26, profundidad: 0.85, generado: "2026-11-18" }));
    }
    process.chdir(dir);
    return dir;
  };

  it("devuelve el ángulo medido al generar los mapas", () => {
    montar("te-4001", { meta: { sku: "TE-4001", anguloMax: 22, profundidad: 0.85, generado: "2026-11-18" } });
    expect(relieveDe("TE-4001")?.anguloMax).toBe(22);
  });

  it("acepta el SKU en cualquier caja", () => {
    montar("te-4002");
    expect(relieveDe("te-4002")).not.toBeNull();
    expect(relieveDe("TE-4002")).not.toBeNull();
  });

  it("sin meta.json no hay relieve", () => {
    montar("te-4003", { meta: null });
    expect(relieveDe("TE-4003")).toBeNull();
  });

  it("si falta un mapa no hay relieve, aunque exista meta.json", () => {
    montar("te-4004", { mapas: ["color.webp", "profundidad.webp"] });
    expect(relieveDe("TE-4004")).toBeNull();
  });

  it("meta.json corrupto no rompe la ficha", () => {
    const dir = montar("te-4005");
    fs.writeFileSync(path.join(dir, "public", "products", "relieve", "te-4005", "meta.json"), "{roto");
    expect(relieveDe("TE-4005")).toBeNull();
  });

  it("sin SKU no hay relieve", () => {
    expect(relieveDe(null)).toBeNull();
    expect(relieveDe(undefined)).toBeNull();
    expect(relieveDe("")).toBeNull();
  });

  it("la ruta pública es la que se sirve desde /public", () => {
    expect(rutaRelieve("TE-4001")).toBe("/products/relieve/te-4001");
  });

  it("lista solo los SKU completos", () => {
    const dir = montar("te-4001");
    const base = path.join(dir, "public", "products", "relieve");
    fs.mkdirSync(path.join(base, "te-4002"));
    fs.writeFileSync(path.join(base, "te-4002", "color.webp"), "");
    expect(skusConRelieve()).toEqual(["TE-4001"]);
  });
});
