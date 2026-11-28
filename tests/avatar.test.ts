import { describe, expect, it } from "vitest";
import { idiomaDe } from "@/lib/i18n-dict";
import { urlAvatar } from "@/lib/avatar";

describe("idioma guardado en la cuenta", () => {
  it("acepta solo los idiomas que existen", () => {
    expect(idiomaDe("es")).toBe("es");
    expect(idiomaDe("en")).toBe("en");
  });

  it("descarta cualquier otro valor", () => {
    for (const v of ["fr", "ES", "", null, undefined, 1, true, {}]) expect(idiomaDe(v)).toBeNull();
  });
});

describe("avatar de la cuenta", () => {
  it("acepta un enlace https del proveedor", () => {
    const url = "https://lh3.googleusercontent.com/a/ACg8ocK=s96-c";
    expect(urlAvatar(url)).toBe(url);
  });

  it("rechaza esquemas que no son https y valores raros", () => {
    for (const v of [
      "http://lh3.googleusercontent.com/a/x.png",
      "javascript:alert(1)",
      "data:image/png;base64,AAAA",
      " https://lh3.googleusercontent.com/a/x.png",
      'https://x.com/a"onerror=alert(1)',
      "",
      null,
      undefined,
      42,
      `https://x.com/${"a".repeat(400)}`,
    ]) expect(urlAvatar(v)).toBeNull();
  });
});
