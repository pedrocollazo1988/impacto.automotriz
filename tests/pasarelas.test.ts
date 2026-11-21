import { describe, expect, it } from "vitest";
import { comision, disponiblesPara, estaOperativa, motivoNoDisponible, totalConComision, type Pasarela } from "@/lib/pasarelas";

const base = (p: Partial<Pasarela> & Pick<Pasarela, "key">): Pasarela => ({
  name: p.key, description: "", kind: "online", enabled: true, sandbox: true, sortOrder: 0,
  instructions: "", feePercent: 0, minTotalUsd: null, maxTotalUsd: null, ...p,
});

const CREDS = {
  TROPIPAY: { clientId: "id", clientSecret: "sec" },
  QVAPAY: { appId: "id", appSecret: "sec" },
  TRANSFER: null,
  CASH: null,
} as const;

const credsDe = (k: Pasarela["key"]) => (CREDS as Record<string, Record<string, string> | null>)[k] ?? null;

describe("estaOperativa", () => {
  it("una pasarela desactivada nunca está operativa", () => {
    expect(estaOperativa({ key: "TROPIPAY", enabled: false }, CREDS.TROPIPAY)).toBe(false);
  });

  it("online sin credenciales no está operativa", () => {
    expect(estaOperativa({ key: "TROPIPAY", enabled: true }, null)).toBe(false);
    expect(estaOperativa({ key: "TROPIPAY", enabled: true }, { clientId: "solo-id" })).toBe(false);
  });

  it("online con credenciales completas sí", () => {
    expect(estaOperativa({ key: "TROPIPAY", enabled: true }, CREDS.TROPIPAY)).toBe(true);
  });

  it("las manuales no necesitan credenciales", () => {
    expect(estaOperativa({ key: "TRANSFER", enabled: true }, null)).toBe(true);
    expect(estaOperativa({ key: "CASH", enabled: true }, null)).toBe(true);
  });
});

describe("motivoNoDisponible", () => {
  it("explica que está desactivada", () => {
    expect(motivoNoDisponible(base({ key: "TRANSFER", enabled: false }), null)).toMatch(/Desactivada/);
  });

  it("nombra el secreto que falta", () => {
    const m = motivoNoDisponible(base({ key: "TROPIPAY" }), { clientId: "x" });
    expect(m).toMatch(/Client Secret/);
  });

  it("null cuando todo está bien", () => {
    expect(motivoNoDisponible(base({ key: "TROPIPAY" }), CREDS.TROPIPAY)).toBeNull();
  });
});

describe("disponiblesPara", () => {
  const lista = [
    base({ key: "CASH", kind: "manual", sortOrder: 4 }),
    base({ key: "TRANSFER", kind: "manual", sortOrder: 3 }),
    base({ key: "QVAPAY", sortOrder: 2 }),
    base({ key: "TROPIPAY", sortOrder: 1 }),
  ];

  it("devuelve en el orden configurado", () => {
    expect(disponiblesPara(100, lista, credsDe).map((p) => p.key)).toEqual(["TROPIPAY", "QVAPAY", "TRANSFER", "CASH"]);
  });

  it("quita las desactivadas", () => {
    const l = lista.map((p) => (p.key === "CASH" ? { ...p, enabled: false } : p));
    expect(disponiblesPara(100, l, credsDe).map((p) => p.key)).not.toContain("CASH");
  });

  it("respeta el importe mínimo", () => {
    const l = lista.map((p) => (p.key === "TRANSFER" ? { ...p, minTotalUsd: 50 } : p));
    expect(disponiblesPara(20, l, credsDe).map((p) => p.key)).not.toContain("TRANSFER");
    expect(disponiblesPara(80, l, credsDe).map((p) => p.key)).toContain("TRANSFER");
  });

  it("respeta el importe máximo", () => {
    const l = lista.map((p) => (p.key === "CASH" ? { ...p, maxTotalUsd: 200 } : p));
    expect(disponiblesPara(500, l, credsDe).map((p) => p.key)).not.toContain("CASH");
  });

  it("una pasarela online sin credenciales no se ofrece aunque esté activa", () => {
    const sinCreds = (k: Pasarela["key"]) => (k === "TROPIPAY" ? null : credsDe(k));
    expect(disponiblesPara(100, lista, sinCreds).map((p) => p.key)).not.toContain("TROPIPAY");
  });

  it("si no hay ninguna disponible devuelve lista vacía", () => {
    expect(disponiblesPara(100, [], credsDe)).toEqual([]);
  });
});

describe("comisión", () => {
  it("sin comisión devuelve 0", () => {
    expect(comision({ feePercent: 0 }, 100)).toBe(0);
  });

  it("calcula el porcentaje redondeado a centavos", () => {
    expect(comision({ feePercent: 3.5 }, 99.99)).toBe(3.5);
    expect(comision({ feePercent: 2.5 }, 10)).toBe(0.25);
  });

  it("el total suma la comisión", () => {
    expect(totalConComision({ feePercent: 5 }, 100)).toBe(105);
    expect(totalConComision({ feePercent: 0 }, 42.42)).toBe(42.42);
  });

  it("no acumula error de coma flotante", () => {
    // 0.1 + 0.2 clásico: debe quedar 0.3, no 0.30000000000000004
    expect(totalConComision({ feePercent: 0 }, 0.1 + 0.2)).toBe(0.3);
  });
});
