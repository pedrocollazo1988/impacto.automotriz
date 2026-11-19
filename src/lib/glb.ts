// Escritor mínimo de glTF 2.0 binario (GLB), sin dependencias externas.
// Compone un modelo a partir de varias piezas con color sólido.

import { bbox, sinDegenerados, type Geo } from "./geom";

const MAGIC = 0x46546c67; // "glTF"
const JSON_CHUNK = 0x4e4f534a;
const BIN_CHUNK = 0x004e4942;

const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;

export type Pieza = {
  geo: Geo;
  color: [number, number, number];
  metalico?: number;
  rugosidad?: number;
  nombre?: string;
};

const pad4 = (n: number) => (4 - (n % 4)) % 4;

// glTF guarda el color en espacio lineal; los valores de marca están en sRGB.
const lineal = (c: number) => (c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4);

export function buildModelGLB(opts: { piezas: Pieza[]; nombre?: string }): Buffer {
  const nombre = opts.nombre ?? "Producto";
  const views: { buffer: number; byteOffset: number; byteLength: number; target?: number }[] = [];
  const chunks: Buffer[] = [];
  let offset = 0;

  const push = (bytes: Buffer, target?: number) => {
    views.push({ buffer: 0, byteOffset: offset, byteLength: bytes.length, ...(target ? { target } : {}) });
    chunks.push(bytes);
    offset += bytes.length;
    const p = pad4(offset);
    if (p) {
      chunks.push(Buffer.alloc(p));
      offset += p;
    }
    return views.length - 1;
  };
  const bufOf = (a: ArrayBufferView) => Buffer.from(a.buffer, a.byteOffset, a.byteLength);

  const accessors: Record<string, unknown>[] = [];
  const primitives: unknown[] = [];
  const materials: unknown[] = [];

  for (const pieza of opts.piezas) {
    const geo = sinDegenerados(pieza.geo);
    if (!geo.idx.length) continue;
    const p = { ...pieza, geo };
    const { min, max } = bbox(geo);
    const use32 = geo.pos.length / 3 > 65535;
    const indices = use32 ? new Uint32Array(geo.idx) : new Uint16Array(geo.idx);
    const vPos = push(bufOf(new Float32Array(geo.pos)), ARRAY_BUFFER);
    const vNrm = push(bufOf(new Float32Array(geo.nrm)), ARRAY_BUFFER);
    const vIdx = push(bufOf(indices), ELEMENT_ARRAY_BUFFER);
    const a = accessors.length;
    accessors.push(
      { bufferView: vPos, componentType: 5126, count: geo.pos.length / 3, type: "VEC3", min, max },
      { bufferView: vNrm, componentType: 5126, count: geo.nrm.length / 3, type: "VEC3" },
      { bufferView: vIdx, componentType: use32 ? 5125 : 5123, count: geo.idx.length, type: "SCALAR" },
    );
    const m = materials.length;
    materials.push({
      name: p.nombre ?? "Material",
      doubleSided: true,
      pbrMetallicRoughness: {
        baseColorFactor: [lineal(p.color[0]), lineal(p.color[1]), lineal(p.color[2]), 1],
        metallicFactor: p.metalico ?? 0.4,
        roughnessFactor: p.rugosidad ?? 0.55,
      },
    });
    primitives.push({ attributes: { POSITION: a, NORMAL: a + 1 }, indices: a + 2, material: m });
  }

  const bin = Buffer.concat(chunks);
  const gltf = {
    asset: { version: "2.0", generator: "Impacto Automotriz · modelo esquemático" },
    scene: 0,
    scenes: [{ nodes: [0], name: "Escena" }],
    nodes: [{ mesh: 0, name: nombre }],
    meshes: [{ name: nombre, primitives }],
    materials,
    accessors,
    bufferViews: views,
    buffers: [{ byteLength: bin.length }],
  };

  const jsonRaw = Buffer.from(JSON.stringify(gltf), "utf8");
  const json = Buffer.concat([jsonRaw, Buffer.alloc(pad4(jsonRaw.length), 0x20)]);
  const binPad = Buffer.concat([bin, Buffer.alloc(pad4(bin.length))]);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + binPad.length, 8);

  const jsonHead = Buffer.alloc(8);
  jsonHead.writeUInt32LE(json.length, 0);
  jsonHead.writeUInt32LE(JSON_CHUNK, 4);

  const binHead = Buffer.alloc(8);
  binHead.writeUInt32LE(binPad.length, 0);
  binHead.writeUInt32LE(BIN_CHUNK, 4);

  return Buffer.concat([header, jsonHead, json, binHead, binPad]);
}
