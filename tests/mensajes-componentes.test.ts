import { readFileSync } from "node:fs";
import { describe, expect, it } from "vitest";

/** Componentes y páginas ya traducidos. La lista solo crece: cada tanda de la
 *  fase 5 añade los suyos y a partir de ahí no pueden volver al español fijo. */
const TRADUCIDOS = [
  "src/components/GarageManager.tsx",
  "src/components/cuenta/DireccionesCuenta.tsx",
  "src/components/cuenta/PedidosCuenta.tsx",
  "src/app/(store)/cuenta/page.tsx",
  "src/app/(store)/cuenta/LogoutButton.tsx",
  "src/components/site/SiteFooter.tsx",
];

const LITERALES = /["`]([^"`\n]{2,200})["`]/g;
const ACENTOS = /[áéíóúüñ¿¡]/i;
const PALABRAS = /\b(el|la|los|las|de|del|para|con|sin|tu|tus|Mis|Añadir|Añade|Guarda|Escribe|Ver|Buscar|Elige|pedidos|deseos|vehículos|direcciones|garaje|cuenta)\b/i;
// Rutas, anclas, claves de diccionario y clases no son texto para el visitante.
const NO_ES_TEXTO = /^(\/|#|https?:|[\d._-]+$|[a-z0-9-]+(\.[a-z0-9-]+)+$)/;
const IGNORAR_LINEA = /^\s*(\/\/|\*|\/\*)|className=|import |\bt\("|\bfrom "/;

/** Frase visible: lleva espacio o empieza en mayúscula. Un slug suelto no. */
const esFrase = (s: string) => /\s/.test(s) || /^[A-ZÁÉÍÓÚ¡¿]/.test(s);

describe("textos de los componentes ya traducidos", () => {
  it("no quedan literales visibles en español fuera del diccionario", () => {
    const culpables: string[] = [];
    for (const fichero of TRADUCIDOS) {
      readFileSync(fichero, "utf8").split("\n").forEach((linea, i) => {
        if (IGNORAR_LINEA.test(linea)) return;
        for (const m of linea.matchAll(LITERALES)) {
          const texto = m[1];
          if (NO_ES_TEXTO.test(texto) || !esFrase(texto)) continue;
          if (ACENTOS.test(texto) || PALABRAS.test(texto)) culpables.push(`${fichero}:${i + 1} «${texto.slice(0, 60)}»`);
        }
      });
    }
    expect(culpables).toEqual([]);
  });
});
