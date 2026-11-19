import { describe, expect, it } from "vitest";
import { urlModelo } from "@/lib/model-url";

describe("urlModelo", () => {
  it("rederiva del SKU una ruta antigua por slug", () => {
    expect(urlModelo({ sku: "EL-3001", model3dUrl: "/models/bateria-12v-60ah.glb" })).toBe("/models/el-3001.glb");
  });
  it("respeta un .glb alojado en Vercel Blob", () => {
    const url = "https://x.public.blob.vercel-storage.com/productos/a.glb";
    expect(urlModelo({ sku: "EL-3001", model3dUrl: url })).toBe(url);
  });
  it("sustituye un marcador externo por el modelo real del SKU", () => {
    expect(urlModelo({ sku: "TE-4001", model3dUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb" })).toBe("/models/te-4001.glb");
  });
  it("descarta el marcador externo si el SKU no tiene modelo", () => {
    expect(urlModelo({ sku: "DEMO-004", model3dUrl: "https://modelviewer.dev/shared-assets/models/Astronaut.glb" })).toBeNull();
  });
  it("da modelo por SKU aunque la base de datos no lo marque", () => {
    expect(urlModelo({ sku: "SU-2001", model3dUrl: null })).toBe("/models/su-2001.glb");
  });
  it("no inventa modelo para un SKU sin fichero", () => {
    expect(urlModelo({ sku: "DEMO-004" })).toBeNull();
  });
  it("sin SKU ni ruta no hay modelo", () => {
    expect(urlModelo({})).toBeNull();
  });
});
