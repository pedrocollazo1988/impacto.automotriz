// Escritor mínimo de glTF 2.0 binario (GLB) sin dependencias externas.
// Genera una "placa" 3D (caja fina) con la foto del producto en las caras frontal y
// trasera y los cantos en color sólido, lista para el visor <model-viewer>.

export type GlbImage = { data: Buffer; mime: "image/png" | "image/jpeg" };

const MAGIC = 0x46546c67; // "glTF"
const JSON_CHUNK = 0x4e4f534a; // "JSON"
const BIN_CHUNK = 0x004e4942; // "BIN\0"

const ARRAY_BUFFER = 34962;
const ELEMENT_ARRAY_BUFFER = 34963;

type Vec3 = [number, number, number];
type Vec2 = [number, number];

type Quad = { corners: [Vec3, Vec3, Vec3, Vec3]; normal: Vec3; uv: [Vec2, Vec2, Vec2, Vec2] };

const pad4 = (n: number) => (4 - (n % 4)) % 4;

// Concatena varios quads en un solo búfer de vértices + índices.
function geometry(quads: Quad[]) {
  const pos: number[] = [];
  const nrm: number[] = [];
  const uv: number[] = [];
  const idx: number[] = [];
  for (const q of quads) {
    const base = pos.length / 3;
    for (let i = 0; i < 4; i++) {
      pos.push(...q.corners[i]);
      nrm.push(...q.normal);
      uv.push(...q.uv[i]);
    }
    idx.push(base, base + 1, base + 2, base, base + 2, base + 3);
  }
  return { pos: new Float32Array(pos), nrm: new Float32Array(nrm), uv: new Float32Array(uv), idx: new Uint16Array(idx) };
}

export function buildTexturedBoxGLB(opts: {
  image: GlbImage;
  aspect?: number; // alto / ancho de la foto
  depth?: number;
  sideColor?: [number, number, number, number];
  name?: string;
}): Buffer {
  const W = 1;
  const H = Math.max(0.3, Math.min(2.5, opts.aspect ?? 0.75));
  const D = Math.max(0.02, Math.min(0.5, opts.depth ?? 0.16));
  const hw = W / 2, hh = H / 2, hd = D / 2;
  const side = opts.sideColor ?? [0.043, 0.165, 0.357, 1]; // navy de la marca

  // La foto mira al frente (+Z) y, en la trasera (-Z), se voltea para leerse bien.
  const front = geometry([
    { corners: [[-hw, -hh, hd], [hw, -hh, hd], [hw, hh, hd], [-hw, hh, hd]], normal: [0, 0, 1], uv: [[0, 1], [1, 1], [1, 0], [0, 0]] },
    { corners: [[hw, -hh, -hd], [-hw, -hh, -hd], [-hw, hh, -hd], [hw, hh, -hd]], normal: [0, 0, -1], uv: [[0, 1], [1, 1], [1, 0], [0, 0]] },
  ]);
  const edges = geometry([
    { corners: [[hw, -hh, hd], [hw, -hh, -hd], [hw, hh, -hd], [hw, hh, hd]], normal: [1, 0, 0], uv: [[0, 0], [0, 0], [0, 0], [0, 0]] },
    { corners: [[-hw, -hh, -hd], [-hw, -hh, hd], [-hw, hh, hd], [-hw, hh, -hd]], normal: [-1, 0, 0], uv: [[0, 0], [0, 0], [0, 0], [0, 0]] },
    { corners: [[-hw, hh, hd], [hw, hh, hd], [hw, hh, -hd], [-hw, hh, -hd]], normal: [0, 1, 0], uv: [[0, 0], [0, 0], [0, 0], [0, 0]] },
    { corners: [[-hw, -hh, -hd], [hw, -hh, -hd], [hw, -hh, hd], [-hw, -hh, hd]], normal: [0, -1, 0], uv: [[0, 0], [0, 0], [0, 0], [0, 0]] },
  ]);

  const min = [-hw, -hh, -hd];
  const max = [hw, hh, hd];

  // ─────────── Búfer binario ───────────
  const views: { buffer: number; byteOffset: number; byteLength: number; target?: number }[] = [];
  const chunks: Buffer[] = [];
  let offset = 0;
  const push = (bytes: Buffer, target?: number) => {
    const view = { buffer: 0, byteOffset: offset, byteLength: bytes.length, ...(target ? { target } : {}) };
    views.push(view);
    chunks.push(bytes);
    offset += bytes.length;
    const p = pad4(offset);
    if (p) { chunks.push(Buffer.alloc(p)); offset += p; }
    return views.length - 1;
  };
  const bufOf = (a: ArrayBufferView) => Buffer.from(a.buffer, a.byteOffset, a.byteLength);

  const frontPos = push(bufOf(front.pos), ARRAY_BUFFER);
  const frontNrm = push(bufOf(front.nrm), ARRAY_BUFFER);
  const frontUv = push(bufOf(front.uv), ARRAY_BUFFER);
  const frontIdx = push(bufOf(front.idx), ELEMENT_ARRAY_BUFFER);
  const edgePos = push(bufOf(edges.pos), ARRAY_BUFFER);
  const edgeNrm = push(bufOf(edges.nrm), ARRAY_BUFFER);
  const edgeIdx = push(bufOf(edges.idx), ELEMENT_ARRAY_BUFFER);
  const imageView = push(opts.image.data);

  const bin = Buffer.concat(chunks);

  const accessors = [
    { bufferView: frontPos, componentType: 5126, count: front.pos.length / 3, type: "VEC3", min, max },
    { bufferView: frontNrm, componentType: 5126, count: front.nrm.length / 3, type: "VEC3" },
    { bufferView: frontUv, componentType: 5126, count: front.uv.length / 2, type: "VEC2" },
    { bufferView: frontIdx, componentType: 5123, count: front.idx.length, type: "SCALAR" },
    { bufferView: edgePos, componentType: 5126, count: edges.pos.length / 3, type: "VEC3", min, max },
    { bufferView: edgeNrm, componentType: 5126, count: edges.nrm.length / 3, type: "VEC3" },
    { bufferView: edgeIdx, componentType: 5123, count: edges.idx.length, type: "SCALAR" },
  ];

  const gltf = {
    asset: { version: "2.0", generator: "Impacto Automotriz · generador 3D" },
    scene: 0,
    scenes: [{ nodes: [0], name: "Escena" }],
    nodes: [{ mesh: 0, name: opts.name ?? "Producto" }],
    meshes: [{
      name: opts.name ?? "Producto",
      primitives: [
        { attributes: { POSITION: 0, NORMAL: 1, TEXCOORD_0: 2 }, indices: 3, material: 0 },
        { attributes: { POSITION: 4, NORMAL: 5 }, indices: 6, material: 1 },
      ],
    }],
    materials: [
      { name: "Foto", doubleSided: true, pbrMetallicRoughness: { baseColorTexture: { index: 0 }, metallicFactor: 0, roughnessFactor: 0.55 } },
      { name: "Canto", doubleSided: true, pbrMetallicRoughness: { baseColorFactor: side, metallicFactor: 0.25, roughnessFactor: 0.65 } },
    ],
    textures: [{ sampler: 0, source: 0 }],
    samplers: [{ magFilter: 9729, minFilter: 9987, wrapS: 33071, wrapT: 33071 }],
    images: [{ bufferView: imageView, mimeType: opts.image.mime }],
    accessors,
    bufferViews: views,
    buffers: [{ byteLength: bin.length }],
  };

  // ─────────── Contenedor GLB ───────────
  const jsonRaw = Buffer.from(JSON.stringify(gltf), "utf8");
  const json = Buffer.concat([jsonRaw, Buffer.alloc(pad4(jsonRaw.length), 0x20)]);
  const binPadded = Buffer.concat([bin, Buffer.alloc(pad4(bin.length))]);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(MAGIC, 0);
  header.writeUInt32LE(2, 4);
  header.writeUInt32LE(12 + 8 + json.length + 8 + binPadded.length, 8);

  const jsonHead = Buffer.alloc(8);
  jsonHead.writeUInt32LE(json.length, 0);
  jsonHead.writeUInt32LE(JSON_CHUNK, 4);

  const binHead = Buffer.alloc(8);
  binHead.writeUInt32LE(binPadded.length, 0);
  binHead.writeUInt32LE(BIN_CHUNK, 4);

  return Buffer.concat([header, jsonHead, json, binHead, binPadded]);
}
