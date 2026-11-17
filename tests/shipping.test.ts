import { describe, expect, it, vi } from "vitest";

const method = (over: object) => ({ id: 1, code: "DOMICILIO", name: "Entrega a domicilio", kind: "HOME_DELIVERY", description: null, requiresAddress: true, cashOnDelivery: true, baseFee: 3, freeFromUsd: null, etaMinDays: 1, etaMaxDays: 3, slots: [], rules: [], ...over });
const db = vi.hoisted(() => ({ municipality: { findUnique: vi.fn() }, deliveryMethod: { findMany: vi.fn() }, pickupPoint: { findMany: vi.fn() } }));
vi.mock("@/lib/prisma", () => ({ prisma: db }));
import { quoteDelivery } from "@/lib/shipping";

describe("quoteDelivery", () => {
  db.municipality.findUnique.mockResolvedValue({ id: 10, provinceId: 3 });
  db.pickupPoint.findMany.mockResolvedValue([]);
  it("sin regla el método NO está disponible", async () => {
    db.deliveryMethod.findMany.mockResolvedValue([method({})]);
    expect((await quoteDelivery(10, 50))[0].available).toBe(false);
  });
  it("la regla del municipio gana a la de la provincia", async () => {
    db.deliveryMethod.findMany.mockResolvedValue([method({ rules: [{ municipalityId: null, available: true, feeUsd: 5 }, { municipalityId: 10, available: true, feeUsd: 2 }] })]);
    expect((await quoteDelivery(10, 50))[0]).toMatchObject({ available: true, feeUsd: 2 });
  });
  it("respeta pedido mínimo y envío gratis", async () => {
    db.deliveryMethod.findMany.mockResolvedValue([method({ rules: [{ municipalityId: null, available: true, feeUsd: 5, minOrderUsd: 20, freeFromUsd: 100 }] })]);
    expect((await quoteDelivery(10, 10))[0].available).toBe(false);
    expect((await quoteDelivery(10, 50))[0].feeUsd).toBe(5);
    expect((await quoteDelivery(10, 150))[0].feeUsd).toBe(0);
  });
  it("la recogida solo exige puntos activos", async () => {
    db.pickupPoint.findMany.mockResolvedValue([{ id: 1, name: "Tienda", address: "Calle 1", hours: null, readyHours: 24 }]);
    db.deliveryMethod.findMany.mockResolvedValue([method({ code: "RECOGIDA", kind: "STORE_PICKUP", requiresAddress: false, baseFee: 0 })]);
    expect((await quoteDelivery(10, 5))[0]).toMatchObject({ available: true, feeUsd: 0 });
  });
});
