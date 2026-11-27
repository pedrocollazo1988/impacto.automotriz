import { describe, expect, it, vi } from "vitest";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

vi.mock("@/components/site/Preferences", () => ({ usePreferences: () => ({ lang: "es", t: (k: string) => k }) }));
vi.mock("@/components/brand/Icon", () => ({ default: () => null }));
vi.mock("@/lib/phone", () => ({ paisDelNavegador: () => "CU" }));

import PhoneField from "@/components/phone/PhoneField";

const pintar = (valor = "") => renderToStaticMarkup(React.createElement(PhoneField, { value: valor, onChange: () => {} }));

describe("PhoneField", () => {
  it("muestra el país y el prefijo por defecto, no un hueco", () => {
    const html = pintar();
    expect(html).toContain("+53");
    expect(html).not.toContain(">—<");
  });

  it("parte del número guardado en formato internacional", () => {
    const html = pintar("+5355551234");
    expect(html).toContain("+53");
    expect(html).toContain("05 5551234");
  });

  it("pinta el mensaje de error cuando lo hay", () => {
    expect(renderToStaticMarkup(React.createElement(PhoneField, { value: "", onChange: () => {}, error: "mal" }))).toContain("mal");
  });
});
