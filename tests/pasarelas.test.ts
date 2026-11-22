import { describe, expect, it } from "vitest";
import {
  camposPendientes,
  claveValida,
  comision,
  datosPublicos,
  disponiblesPara,
  driverDe,
  esCobroAutomatico,
  estaOperativa,
  limpiarCampos,
  motivoNoDisponible,
  requiereContraEntrega,
  slugify,
  totalConComision,
  type Pasarela,
} from "@/lib/pasarelas";

const proveedorDe = (key: string): Pasarela["provider"] =>
  key === "TROPIPAY" ? "tropipay" : key === "QVAPAY" ? "qvapay" : "manual";

const base = (p: Partial<Pasarela> & Pick<Pasarela, "key">): Pasarela => ({
  provider: proveedorDe(p.key), name: p.key, description: "", kind: "online", icon: "card",
  enabled: true, archived: false, sandbox: true, sortOrder: 0, instructions: "",
  feePercent: 0, minTotalUsd: null, maxTotalUsd: null, config: null, ...p,
});

const CREDS = {
  TROPIPAY: { clientId: "id", clientSecret: "sec" },
  QVAPAY: { appId: "id", appSecret: "sec" },
  TRANSFER: null,
  CASH: null,
} as const;

const credsDe = (k: string) => (CREDS as Record<string, Record<string, string> | null>)[k] ?? null;

describe("estaOperativa", () => {
  it("un método desactivado nunca está operativo", () => {
    expect(estaOperativa(base({ key: "TROPIPAY", enabled: false }), CREDS.TROPIPAY)).toBe(false);
  });

  it("un automático sin credenciales no está operativo", () => {
    expect(estaOperativa(base({ key: "TROPIPAY" }), null)).toBe(false);
    expect(estaOperativa(base({ key: "TROPIPAY" }), { clientSecret: "solo-secreto" })).toBe(false);
  });

  it("un automático con credenciales completas sí", () => {
    expect(estaOperativa(base({ key: "TROPIPAY", config: { clientId: "id" } }), CREDS.TROPIPAY)).toBe(true);
  });

  it("los manuales no necesitan credenciales", () => {
    expect(estaOperativa(base({ key: "TRANSFER", provider: "manual", kind: "manual" }), null)).toBe(true);
    expect(estaOperativa(base({ key: "CASH", provider: "manual", kind: "manual" }), null)).toBe(true);
  });

  it("un enlace externo necesita su URL", () => {
    expect(estaOperativa(base({ key: "paypal", provider: "link", kind: "manual" }), null)).toBe(false);
    expect(estaOperativa(base({ key: "paypal", provider: "link", kind: "manual", config: { url: "https://paypal.me/x" } }), null)).toBe(true);
  });

  it("un archivado no está operativo aunque esté activo", () => {
    expect(estaOperativa(base({ key: "TRANSFER", provider: "manual", archived: true }), null)).toBe(false);
  });
});

describe("motivoNoDisponible", () => {
  it("explica que está desactivado", () => {
    expect(motivoNoDisponible(base({ key: "TRANSFER", provider: "manual", enabled: false }), null)).toMatch(/Desactivado/);
  });

  it("nombra el secreto que falta", () => {
    const m = motivoNoDisponible(base({ key: "TROPIPAY", config: { clientId: "x" } }), {});
    expect(m).toMatch(/Client Secret/);
  });

  it("null cuando todo está bien", () => {
    expect(motivoNoDisponible(base({ key: "TROPIPAY", config: { clientId: "id" } }), CREDS.TROPIPAY)).toBeNull();
  });
});

describe("disponiblesPara", () => {
  const lista = [
    base({ key: "CASH", provider: "manual", kind: "manual", sortOrder: 4 }),
    base({ key: "TRANSFER", provider: "manual", kind: "manual", sortOrder: 3 }),
    base({ key: "QVAPAY", sortOrder: 2 }),
    base({ key: "TROPIPAY", sortOrder: 1 }),
  ];

  it("devuelve en el orden configurado", () => {
    expect(disponiblesPara(100, lista, credsDe).map((p) => p.key)).toEqual(["TROPIPAY", "QVAPAY", "TRANSFER", "CASH"]);
  });

  it("quita los desactivados", () => {
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

  it("un automático sin credenciales no se ofrece aunque esté activo", () => {
    const sinCreds = (k: string) => (k === "TROPIPAY" ? null : credsDe(k));
    expect(disponiblesPara(100, lista, sinCreds).map((p) => p.key)).not.toContain("TROPIPAY");
  });

  it("si no hay ninguno disponible devuelve lista vacía", () => {
    expect(disponiblesPara(100, [], credsDe)).toEqual([]);
  });
});

describe("drivers", () => {
  it("reconoce el proveedor por su id", () => {
    expect(driverDe("tropipay").nombre).toBe("Tropipay");
    expect(driverDe(base({ key: "x", provider: "link" })).kind).toBe("manual");
  });

  it("solo los automáticos crean el cobro en el servidor", () => {
    expect(esCobroAutomatico(base({ key: "TROPIPAY" }))).toBe(true);
    expect(esCobroAutomatico(base({ key: "TRANSFER", provider: "manual" }))).toBe(false);
  });
});

describe("datos públicos y campos", () => {
  it("muestra banco, cuenta y titular, pero no reglas internas", () => {
    const p = base({ key: "TRANSFER", provider: "manual", kind: "manual", config: { banco: "BPA", cuenta: "123", requiereContraEntrega: "true" } });
    expect(datosPublicos(p)).toEqual([
      { etiqueta: "Banco", valor: "BPA" },
      { etiqueta: "Número de cuenta", valor: "123" },
    ]);
  });

  it("separa secretos de datos públicos y conserva los checkboxes", () => {
    const { publicos, secretos } = limpiarCampos("tropipay", { clientId: "id", clientSecret: "sec", reasonId: "4" });
    expect(publicos).toEqual({ clientId: "id", reasonId: "4" });
    expect(secretos).toEqual({ clientSecret: "sec" });
    expect(limpiarCampos("manual", { requiereContraEntrega: true }).publicos).toEqual({ requiereContraEntrega: "true" });
  });

  it("acepta los campos públicos antiguos guardados en credenciales", () => {
    expect(camposPendientes(base({ key: "TROPIPAY" }), { clientId: "id", clientSecret: "sec" })).toEqual([]);
  });

  it("detecta la regla de pago contra entrega", () => {
    expect(requiereContraEntrega(base({ key: "CASH", provider: "manual" }))).toBe(true);
    expect(requiereContraEntrega(base({ key: "x", provider: "manual", config: { requiereContraEntrega: "true" } }))).toBe(true);
    expect(requiereContraEntrega(base({ key: "TRANSFER", provider: "manual" }))).toBe(false);
  });
});

describe("claves", () => {
  it("genera slugs sin acentos", () => {
    expect(slugify("Transferencia bancaria")).toBe("transferencia-bancaria");
    expect(slugify("Depósito / Zelle")).toBe("deposito-zelle");
    expect(slugify("   ")).toBe("pago");
  });

  it("valida la clave que se guarda en el pedido", () => {
    expect(claveValida("TROPIPAY")).toBe(true);
    expect(claveValida("zelle-cuenta-2")).toBe(true);
    expect(claveValida("a")).toBe(false);
    expect(claveValida("con espacio")).toBe(false);
    expect(claveValida("-empieza-mal")).toBe(false);
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
    expect(totalConComision({ feePercent: 0 }, 0.1 + 0.2)).toBe(0.3);
  });
});
