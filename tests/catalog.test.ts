import { describe, expect, it, vi } from "vitest";
vi.mock("@/lib/prisma", () => ({ prisma: {} }));
import { parseCsv, slugify } from "@/lib/catalog";

describe("slugify", () => {
  it("quita acentos y símbolos", () => expect(slugify("Amortiguador Trasero ¡Ñandú! 16\"")).toBe("amortiguador-trasero-nandu-16"));
});
describe("parseCsv", () => {
  it("detecta punto y coma y comillas", () => {
    const rows = parseCsv('\uFEFFsku;nombre;precio\nA1;"Pastillas; delanteras";25,50\nA2;"Dice ""hola""";3\n');
    expect(rows).toEqual([["sku", "nombre", "precio"], ["A1", "Pastillas; delanteras", "25,50"], ["A2", 'Dice "hola"', "3"]]);
  });
  it("acepta comas y saltos CRLF; ignora filas vacías", () => expect(parseCsv("a,b\r\n1,2\r\n\r\n")).toEqual([["a", "b"], ["1", "2"]]));
});
