import { describe, expect, it } from "vitest";
import { aplicarColumnas } from "@/lib/columnas";

const espia = () => {
  const sql: string[] = [];
  return { sql, cliente: { $executeRawUnsafe: async (s: string) => { sql.push(s); } } };
};

describe("aplicarColumnas", () => {
  it("crea todas las columnas con ADD COLUMN IF NOT EXISTS", async () => {
    const { sql, cliente } = espia();
    await aplicarColumnas(cliente);
    expect(sql.length).toBeGreaterThan(0);
    for (const s of sql) expect(s).toContain("ADD COLUMN IF NOT EXISTS");
  });

  it("cubre las columnas que el esquema añadió después del despliegue", async () => {
    const { sql, cliente } = espia();
    await aplicarColumnas(cliente);
    const todo = sql.join("\n");
    for (const c of ["viewerMode", "videos", "model3dVideo", "spin360Frames", "spin360Video"])
      expect(todo).toContain(`"${c}"`);
  });

  it("solo ejecuta el DDL una vez aunque se llame en paralelo", async () => {
    const { sql, cliente } = espia();
    await Promise.all([aplicarColumnas(cliente), aplicarColumnas(cliente), aplicarColumnas(cliente)]);
    await aplicarColumnas(cliente);
    expect(new Set(sql).size).toBe(sql.length);
  });

  it("no lanza si la base rechaza el DDL", async () => {
    const cliente = { $executeRawUnsafe: async () => { throw new Error("permission denied"); } };
    await expect(aplicarColumnas(cliente)).resolves.toBeUndefined();
  });
});
