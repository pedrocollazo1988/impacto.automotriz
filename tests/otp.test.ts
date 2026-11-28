import { beforeEach, describe, expect, it, vi } from "vitest";

type Fila = { id: string; identifier: string; channel: string; purpose: string; codeHash: string; expiresAt: Date; attempts: number; consumedAt: Date | null; customerId: string | null; ip: string | null; createdAt: Date };

const db = vi.hoisted(() => {
  const filas: Fila[] = [];
  let n = 0;
  const coincide = (f: Fila, where: Record<string, unknown>) =>
    Object.entries(where).every(([k, v]) => {
      const valor = (f as unknown as Record<string, unknown>)[k];
      if (v && typeof v === "object" && "in" in (v as object)) return ((v as { in: unknown[] }).in ?? []).includes(valor as never);
      return valor === v;
    });
  return {
    filas,
    prisma: {
      otpCode: {
        findFirst: async ({ where, orderBy }: { where: Record<string, unknown>; orderBy?: { createdAt: "asc" | "desc" } }) => {
          const encontradas = filas.filter((f) => coincide(f, where));
          if (orderBy?.createdAt === "desc") encontradas.sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
          if (orderBy?.createdAt === "asc") encontradas.sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
          return encontradas[0] ?? null;
        },
        create: async ({ data }: { data: Partial<Fila> }) => {
          const fila: Fila = { id: `otp${++n}`, attempts: 0, consumedAt: null, customerId: null, ip: null, createdAt: new Date(), ...data } as Fila;
          filas.push(fila);
          return { id: fila.id };
        },
        update: async ({ where: { id }, data }: { where: { id: string }; data: Partial<Fila> }) => {
          const fila = filas.find((f) => f.id === id)!;
          Object.assign(fila, data);
          return fila;
        },
        updateMany: async ({ where, data }: { where: Record<string, unknown>; data: Partial<Fila> }) => {
          const afectadas = filas.filter((f) => coincide(f, where));
          afectadas.forEach((f) => Object.assign(f, data));
          return { count: afectadas.length };
        },
      },
      auditLog: { create: async () => ({}) },
    },
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: db.prisma }));

const { crearOtp, generarCodigo, otpHash, enmascarar, verificarOtp, OtpError, OTP_MAX_INTENTOS, OTP_REENVIO_MS } = await import("@/lib/otp");

const TEL = "+5355551234";

describe("generarCodigo", () => {
  it("siempre son seis dígitos, con ceros a la izquierda", () => {
    for (let i = 0; i < 200; i++) expect(generarCodigo()).toMatch(/^\d{6}$/);
  });
});

describe("otpHash", () => {
  it("es estable y depende del número, el propósito y el secreto", () => {
    process.env.APP_SECRET = "secreto-de-prueba";
    const a = otpHash(TEL, "register", "123456");
    expect(a).toBe(otpHash(TEL, "register", "123456"));
    expect(a).toHaveLength(64);
    expect(a).not.toBe(otpHash(TEL, "login", "123456"));
    expect(a).not.toBe(otpHash("+5355551235", "register", "123456"));
    process.env.APP_SECRET = "otro-secreto";
    expect(otpHash(TEL, "register", "123456")).not.toBe(a);
  });

  it("no se puede calcular sin APP_SECRET", () => {
    const guardado = process.env.APP_SECRET;
    delete process.env.APP_SECRET;
    expect(() => otpHash(TEL, "register", "123456")).toThrow(/APP_SECRET/);
    process.env.APP_SECRET = guardado;
  });
});

describe("enmascarar", () => {
  it("deja ver solo el inicio y el final", () => {
    expect(enmascarar("+5355551234")).toBe("+5355****34");
    expect(enmascarar("+1234")).toBe("***");
  });
});

describe("ciclo del código", () => {
  beforeEach(() => {
    process.env.APP_SECRET = "secreto-de-prueba";
    db.filas.length = 0;
  });

  it("guarda el hash, no el código", async () => {
    const { codigo } = await crearOtp({ identifier: TEL, channel: "sms", purpose: "register" });
    expect(db.filas).toHaveLength(1);
    expect(db.filas[0].codeHash).toBe(otpHash(TEL, "register", codigo));
    expect(db.filas[0].codeHash).not.toContain(codigo);
  });

  it("acepta el código correcto y no lo deja reutilizar", async () => {
    const { codigo } = await crearOtp({ identifier: TEL, channel: "sms", purpose: "register" });
    await expect(verificarOtp({ identifier: TEL, purpose: "register", codigo })).resolves.toMatchObject({ ok: true });
    await expect(verificarOtp({ identifier: TEL, purpose: "register", codigo })).resolves.toMatchObject({ ok: false, codigo: "AUTH_OTP_NOT_FOUND" });
  });

  it("bloquea tras cinco intentos fallidos", async () => {
    const { codigo } = await crearOtp({ identifier: TEL, channel: "sms", purpose: "login" });
    const malo = codigo === "000000" ? "111111" : "000000";
    for (let i = 1; i < OTP_MAX_INTENTOS; i++) {
      await expect(verificarOtp({ identifier: TEL, purpose: "login", codigo: malo })).resolves.toMatchObject({ ok: false, codigo: "AUTH_OTP_INVALID" });
    }
    await expect(verificarOtp({ identifier: TEL, purpose: "login", codigo: malo })).resolves.toMatchObject({ ok: false, codigo: "AUTH_OTP_LOCKED" });
    // Ni siquiera el bueno sirve después del bloqueo.
    await expect(verificarOtp({ identifier: TEL, purpose: "login", codigo })).resolves.toMatchObject({ ok: false });
  });

  it("rechaza un código vencido", async () => {
    const { codigo } = await crearOtp({ identifier: TEL, channel: "sms", purpose: "login" });
    db.filas[0].expiresAt = new Date(Date.now() - 1000);
    await expect(verificarOtp({ identifier: TEL, purpose: "login", codigo })).resolves.toMatchObject({ ok: false, codigo: "AUTH_OTP_EXPIRED" });
  });

  it("no deja pedir otro código antes del enfriamiento", async () => {
    await crearOtp({ identifier: TEL, channel: "sms", purpose: "login" });
    await expect(crearOtp({ identifier: TEL, channel: "sms", purpose: "login" })).rejects.toBeInstanceOf(OtpError);
    db.filas[0].createdAt = new Date(Date.now() - OTP_REENVIO_MS - 1000);
    await expect(crearOtp({ identifier: TEL, channel: "sms", purpose: "login" })).resolves.toHaveProperty("codigo");
  });

  it("solo deja vivo el último código de cada propósito", async () => {
    const primero = await crearOtp({ identifier: TEL, channel: "sms", purpose: "login" });
    db.filas[0].createdAt = new Date(Date.now() - OTP_REENVIO_MS - 1000);
    const segundo = await crearOtp({ identifier: TEL, channel: "sms", purpose: "login" });
    await expect(verificarOtp({ identifier: TEL, purpose: "login", codigo: primero.codigo })).resolves.toMatchObject({ ok: false });
    await expect(verificarOtp({ identifier: TEL, purpose: "login", codigo: segundo.codigo })).resolves.toMatchObject({ ok: true });
  });

  it("busca el código por lista de propósitos (registro de una cuenta que ya existía)", async () => {
    const { codigo } = await crearOtp({ identifier: TEL, channel: "sms", purpose: "login" });
    await expect(verificarOtp({ identifier: TEL, purpose: ["register", "login"], codigo })).resolves.toMatchObject({ ok: true });
  });
});
