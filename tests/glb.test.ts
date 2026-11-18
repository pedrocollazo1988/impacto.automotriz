import { describe, expect, it } from "vitest";
import { buildTexturedBoxGLB } from "@/lib/glb";

// PNG 1x1 válido (para no depender de sharp en el test).
const PNG = Buffer.from(
  "iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mNk+M8AAAMBAQDJ/pLvAAAAAElFTkSuQmCC",
  "base64",
);

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

describe("buildTexturedBoxGLB", () => {
  it("produce un contenedor GLB 2.0 bien formado", () => {
    const glb = buildTexturedBoxGLB({ image: { data: PNG, mime: "image/png" }, aspect: 0.75, name: "Prueba" });
    const p = parse(glb);
    expect(p.magic).toBe(0x46546c67); // "glTF"
    expect(p.version).toBe(2);
    expect(p.declared).toBe(glb.length); // longitud declarada == real
    expect(p.jsonType).toBe(0x4e4f534a); // "JSON"
    expect(p.binType).toBe(0x004e4942); // "BIN\0"
    expect(glb.length % 4).toBe(0); // alineado a 4 bytes
  });

  it("declara malla, materiales, textura e imagen coherentes", () => {
    const glb = buildTexturedBoxGLB({ image: { data: PNG, mime: "image/png" }, name: "Prueba" });
    const { json } = parse(glb);
    expect(json.asset.version).toBe("2.0");
    expect(json.meshes[0].primitives.length).toBe(2); // foto + cantos
    expect(json.materials[0].pbrMetallicRoughness.baseColorTexture.index).toBe(0);
    expect(json.textures[0].source).toBe(0);
    expect(json.images[0].mimeType).toBe("image/png");
    expect(json.accessors[0].type).toBe("VEC3");
  });

  it("el búfer binario coincide con lo declarado y contiene la imagen", () => {
    const glb = buildTexturedBoxGLB({ image: { data: PNG, mime: "image/png" } });
    const { json, binLen } = parse(glb);
    expect(binLen).toBe(json.buffers[0].byteLength);
    const bv = json.bufferViews[json.images[0].bufferView];
    expect(bv.byteLength).toBe(PNG.length);
    // Los bytes de la imagen están dentro del bloque binario.
    expect(glb.includes(PNG)).toBe(true);
  });
});
