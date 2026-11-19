import { describe, expect, it } from "vitest";
import { urlModelo } from "@/lib/model-url";

describe("urlModelo", () => {
  it("rederiva del SKU una ruta antigua por slug", () => {
    expect(urlModelo({ sku: "EL-3001", model3dUrl: "/models/bateria-12v-60ah.glb" })).toBe("/models/el-3001.glb");
  });
  it("respeta una URL absoluta de Blob", () => {
    const url = "https://x.public.blob.vercel-storage.com/productos/a.glb";
    expect(urlModelo({ sku: "EL-3001", model3dUrl: url })).toBe(url);
  });
  it("deja sin modelo al producto que no lo tiene", () => {
    expect(urlModelo({ sku: "SU-2001", model3dUrl: null })).toBeNull();
    expect(urlModelo({ sku: "SU-2001" })).toBeNull();
  });
  it("mantiene la ruta guardada si no hay SKU", () => {
    expect(urlModelo({ model3dUrl: "/models/viejo.glb" })).toBe("/models/viejo.glb");
  });
  it("usa la ruta por SKU aunque la guardada ya sea la correcta", () => {
    expect(urlModelo({ sku: "FR-1002", model3dUrl: "/models/fr-1002.glb" })).toBe("/models/fr-1002.glb");
  });
});
