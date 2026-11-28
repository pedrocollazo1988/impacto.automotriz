import { readdirSync, readFileSync, statSync } from "node:fs";
import { join } from "node:path";
import { describe, expect, it } from "vitest";

/** Rutas que ve el comprador. Un mensaje suyo en español fijo, sin pasar por
 *  src/lib/mensajes.ts, deja al visitante en inglés con un error en español. */
const RUTAS_CLIENTE = [
  "src/app/api/account",
  "src/app/api/checkout",
  "src/app/api/payments",
  "src/app/api/shipping",
  "src/app/api/reviews",
  "src/app/api/geo",
  "src/app/api/email",
];

const ficheros = (dir: string): string[] => {
  const salida: string[] = [];
  for (const nombre of readdirSync(dir)) {
    const ruta = join(dir, nombre);
    if (statSync(ruta).isDirectory()) salida.push(...ficheros(ruta));
    else if (ruta.endsWith(".ts")) salida.push(ruta);
  }
  return salida;
};

// Dos señales: acentos (los hay casi siempre) y palabras que en inglés no
// aparecen en un mensaje de error ("Solo puedes valorar…" no lleva acento).
const PATRON = /(\bHttpError\(\s*\d{3}\s*,\s*"|error:\s*")([^"]*(?:[áéíóúüñ¿¡]|\b(?:puedes|debes|debe|para|producto|pedido|sesión|correo|código|contraseña|carrito|vencido|dirección|teléfono|agotado)\b))/;

describe("mensajes de las rutas del cliente", () => {
  it("no hay mensajes de error en español fuera de src/lib/mensajes.ts", () => {
    const culpables: string[] = [];
    for (const dir of RUTAS_CLIENTE) {
      for (const fichero of ficheros(dir)) {
        readFileSync(fichero, "utf8").split("\n").forEach((linea, i) => {
          if (PATRON.test(linea)) culpables.push(`${fichero}:${i + 1} ${linea.trim()}`);
        });
      }
    }
    expect(culpables).toEqual([]);
  });
});
