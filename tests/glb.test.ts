import { describe, expect, it } from "vitest";
import { buildModelGLB } from "@/lib/glb";
import { box, cylinderY, torusX, bbox, merge } from "@/lib/geom";
import { formaDe } from "@/lib/shapes";

function parse(glb: Buffer) {
  const magic = glb.readUInt32LE(0);
  const version = glb.readUInt32LE(4);
  const declared = glb.readUInt32LE(8);
  const jsonLen = glb.readUInt32LE(12);
  const jsonType = glb.readUInt32LE(16);
  const json = JSON.parse(glb.subarray(20, 20 + jsonLen).toString("utf8"));
  const binLen = glb.readUInt32LE(20 + jsonLen);
  const binType = glb.readUInt32LE(24 + jsonLen);
  return { magic, version, declared, jsonLen, jsonType, json, binLen, binType };
}

describe("buildModelGLB", () => {
  it("produce un contenedor GLB 2.0 bien formado", () => {
    const glb = buildModelGLB({ piezas: [{ geo: box(1, 1, 1), color: [1, 0, 0] }], nombre: "Prueba" });
    const p = parse(glb);
    expect(p.magic).toBe(0x46546c67);
    expect(p.version).toBe(2);
    expect(p.declared).toBe(glb.length);
    expect(p.jsonType).toBe(0x4e4f534a);
    expect(p.binType).toBe(0x004e4942);
    expect(glb.length % 4).toBe(0);
  });

  it("crea una primitiva y un material por pieza", () => {
    const glb = buildModelGLB({
      piezas: [
        { geo: box(1, 1, 1), color: [0, 0, 1], nombre: "A" },
        { geo: cylinderY(0.5, 1), color: [0, 1, 0], nombre: "B" },
        { geo: torusX(0.5, 0.1), color: [1, 1, 1], nombre: "C" },
      ],
    });
    const { json } = parse(glb);
    expect(json.meshes[0].primitives.length).toBe(3);
    expect(json.materials.length).toBe(3);
    expect(json.materials[0].pbrMetallicRoughness.baseColorFactor[2]).toBeCloseTo(1, 5);
  });

  it("el búfer binario coincide con lo declarado", () => {
    const glb = buildModelGLB({ piezas: [{ geo: box(1, 1, 1), color: [0.5, 0.5, 0.5] }] });
    const { json, binLen } = parse(glb);
    expect(binLen).toBe(json.buffers[0].byteLength);
    for (const a of json.accessors) {
      const bv = json.bufferViews[a.bufferView];
      expect(bv.byteOffset % 4).toBe(0);
    }
  });

  it("los colores se convierten a espacio lineal", () => {
    const glb = buildModelGLB({ piezas: [{ geo: box(1, 1, 1), color: [1, 1, 1] }] });
    const { json } = parse(glb);
    expect(json.materials[0].pbrMetallicRoughness.baseColorFactor[0]).toBeCloseTo(1, 5);
    const medio = buildModelGLB({ piezas: [{ geo: box(1, 1, 1), color: [0.5, 0.5, 0.5] }] });
    const f = parse(medio).json.materials[0].pbrMetallicRoughness.baseColorFactor[0];
    expect(f).toBeGreaterThan(0.21);
    expect(f).toBeLessThan(0.22);
  });
});

describe("geometría", () => {
  it("un cubo tiene 24 vértices y 36 índices", () => {
    const g = box(1, 1, 1);
    expect(g.pos.length / 3).toBe(24);
    expect(g.idx.length).toBe(36);
  });

  it("las dimensiones de la caja son las pedidas", () => {
    const { size } = bbox(box(2, 3, 4));
    expect(size[0]).toBeCloseTo(2, 5);
    expect(size[1]).toBeCloseTo(3, 5);
    expect(size[2]).toBeCloseTo(4, 5);
  });

  it("las normales son unitarias", () => {
    const g = cylinderY(0.5, 1, 16);
    for (let i = 0; i < g.nrm.length; i += 3) {
      const l = Math.hypot(g.nrm[i], g.nrm[i + 1], g.nrm[i + 2]);
      expect(l).toBeCloseTo(1, 4);
    }
  });

  it("cada forma del catálogo produce malla con volumen", () => {
    const skus = ["EL-3001", "EL-3002", "FI-6001", "FR-1002", "SU-2001", "TE-4001", "KVI-RUE-01", "KVI-CAR-01"];
    for (const sku of skus) {
      const piezas = formaDe(sku, "");
      expect(piezas.length).toBeGreaterThan(0);
      const total = piezas.reduce((s, p) => s + p.geo.pos.length / 3, 0);
      expect(total).toBeGreaterThan(100);
      const { size } = bbox(merge(...piezas.map((p) => p.geo)));
      // Ninguna forma puede ser una placa plana: los tres ejes deben tener cuerpo.
      const ordenados = [...size].sort((a, b) => b - a);
      expect(ordenados[2] / ordenados[0]).toBeGreaterThan(0.08);
    }
  });
});
