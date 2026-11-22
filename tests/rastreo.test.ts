import { beforeEach, describe, expect, it, vi } from "vitest";

// El riesgo real de esta función no es que falle, sino que acierte de más:
// que con un número de pedido cualquiera devuelva datos de otra persona.
const { pedidoFalso, prismaFalso, limitFalso } = vi.hoisted(() => {
  const pedidoFalso = {
    valor: null as null | { id: string; customerEmail: string; customerPhone: string },
  };
  return {
    pedidoFalso,
    limitFalso: vi.fn(async () => {}),
    prismaFalso: {
      order: { findUnique: async () => pedidoFalso.valor },
      rateLimit: { upsert: async () => ({ count: 1, resetAt: new Date(Date.now() + 60_000) }), update: async () => {} },
    },
  };
});

vi.mock("@/lib/prisma", () => ({ prisma: prismaFalso }));
vi.mock("@/lib/ratelimit", () => ({ limit: limitFalso }));

import { POST } from "@/app/api/pedidos/rastrear/route";

const pedido = {
  id: "ckxyz123",
  customerEmail: "Ana.Perez@Ejemplo.com",
  customerPhone: "+53 5555 1234",
};

// handle() envuelve la ruta como (req, ctx), igual que la invoca Next.
const pedir = (cuerpo: unknown) =>
  POST(
    new Request("http://local/api/pedidos/rastrear", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(cuerpo),
    }),
    undefined,
  );

beforeEach(() => {
  pedidoFalso.valor = pedido;
  vi.clearAllMocks();
});

describe("rastreo público de pedidos", () => {
  it("devuelve el enlace firmado cuando el correo coincide, sin importar mayúsculas", async () => {
    const r = await pedir({ numero: 1024, contacto: "ana.perez@ejemplo.COM" });
    expect(r.status).toBe(200);
    const d = await r.json();
    expect(d.url).toMatch(/^\/pedido\/ckxyz123\?t=[0-9a-f]{32}$/);
  });

  it("acepta el teléfono aunque venga con espacios o guiones", async () => {
    const r = await pedir({ numero: 1024, contacto: "5355551234" });
    expect(r.status).toBe(200);
  });

  it("rechaza un contacto que no es del pedido", async () => {
    const r = await pedir({ numero: 1024, contacto: "otra.persona@ejemplo.com" });
    expect(r.status).toBe(404);
    expect(await r.json()).not.toHaveProperty("url");
  });

  it("da el mismo error si el pedido no existe: no revela qué números son válidos", async () => {
    pedidoFalso.valor = null;
    const r = await pedir({ numero: 999999, contacto: "ana.perez@ejemplo.com" });
    expect(r.status).toBe(404);
    const inexistente = await r.json();

    pedidoFalso.valor = pedido;
    const r2 = await pedir({ numero: 1024, contacto: "desconocido@ejemplo.com" });
    const noCoincide = await r2.json();

    expect(inexistente).toEqual(noCoincide);
  });

  it("no acepta un contacto demasiado corto como para ser real", async () => {
    const r = await pedir({ numero: 1024, contacto: "a@b" });
    expect(r.status).toBe(400);
  });

  it("no acepta un número de pedido que no sea entero positivo", async () => {
    const r = await pedir({ numero: "abc", contacto: "ana.perez@ejemplo.com" });
    expect(r.status).toBe(400);
  });

  it("aplica el límite de intentos antes de tocar la base de datos", async () => {
    await pedir({ numero: 1024, contacto: "ana.perez@ejemplo.com" });
    expect(limitFalso).toHaveBeenCalledWith(expect.anything(), "rastreo", 10);
  });
});
