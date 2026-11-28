import { describe, expect, it } from "vitest";
import { DICCIONARIO } from "@/lib/i18n-dict";

/** Un texto nuevo en español y sin inglés deja al visitante con la versión
 *  española a medias: las dos tablas deben tener exactamente las mismas claves. */
describe("diccionario de la tienda", () => {
  const es = Object.keys(DICCIONARIO.es).sort();
  const en = Object.keys(DICCIONARIO.en).sort();

  it("español e inglés tienen las mismas claves", () => {
    const soloEs = es.filter((k) => !en.includes(k));
    const soloEn = en.filter((k) => !es.includes(k));
    expect({ soloEs, soloEn }).toEqual({ soloEs: [], soloEn: [] });
  });

  it("ningún texto está vacío ni se queda igual en los dos idiomas", () => {
    const vacios = es.filter((k) => !DICCIONARIO.es[k].trim() || !DICCIONARIO.en[k]?.trim());
    expect(vacios).toEqual([]);
  });

  it("las claves de estado de pedido existen en los dos idiomas", () => {
    for (const estado of ["PENDING_PAYMENT", "PAID", "PREPARING", "SHIPPED", "DELIVERED", "CANCELED"]) {
      expect(DICCIONARIO.es[`ord.st.${estado}`]).toBeTruthy();
      expect(DICCIONARIO.en[`ord.st.${estado}`]).toBeTruthy();
    }
  });
});
