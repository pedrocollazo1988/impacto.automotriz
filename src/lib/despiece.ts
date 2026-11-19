import { revalidateTag, unstable_cache } from "next/cache";
import { prisma } from "./prisma";

export type DespiecePin = {
  id: number;
  number: number;
  x: number;
  y: number;
  svgId: string | null;
  label: string | null;
  product: {
    id: number; slug: string; sku: string; name: string; priceUsd: number;
    compareAtUsd: number | null; stock: number; packQty: number | null;
    image: string | null; specs: Record<string, string>;
    variants: { id: number; name: string; priceUsd: number | null; stock: number }[];
  };
};

const num = (d: unknown) => Number(d ?? 0);
const asSpecs = (v: unknown): Record<string, string> =>
  v && typeof v === "object" && !Array.isArray(v) ? Object.fromEntries(Object.entries(v as object).map(([k, x]) => [k, String(x)])) : {};

export async function getVehicles() {
  return prisma.vehicle.findMany({
    where: { active: true },
    orderBy: [{ sortOrder: "asc" }, { brand: "asc" }],
    include: { _count: { select: { diagrams: true } } },
  });
}

// El layout de la tienda pide los vehículos en CADA página solo para pintar el
// selector de "Mi vehículo". Sin caché eso era una ida y vuelta a la base de
// datos en el camino crítico de todo el sitio; el catálogo de vehículos cambia
// muy rara vez, así que se reutiliza la lista durante una hora.
const TAGS_DESPIECE = ["vehiculos-activos", "vehiculos-con-laminas"];

export const getVehiclesCached = unstable_cache(getVehicles, ["vehiculos-activos"], { revalidate: 3600, tags: TAGS_DESPIECE });

// Tras editar pines o láminas en el admin hay que soltar la caché o el cambio
// tardaría hasta una hora en verse en la tienda.
export const invalidarCacheDespiece = () => {
  TAGS_DESPIECE.forEach((t) => revalidateTag(t));
  revalidateTag("vehiculo");
  revalidateTag("lamina");
};

// Índice de despiece: antes hacía una consulta por vehículo (N+1). Con una sola
// consulta se traen todos los vehículos con sus láminas y sistemas.
export const getVehiclesConLaminasCached = unstable_cache(
  async () =>
    prisma.vehicle.findMany({
      where: { active: true },
      orderBy: [{ sortOrder: "asc" }, { brand: "asc" }],
      include: {
        diagrams: {
          orderBy: { sortOrder: "asc" },
          include: { system: true, _count: { select: { pins: true } } },
        },
      },
    }),
  ["vehiculos-con-laminas"],
  { revalidate: 3600, tags: TAGS_DESPIECE },
);

const getVehicleUncached = async (slug: string) => {
  return prisma.vehicle.findFirst({
    where: { slug, active: true },
    include: {
      diagrams: {
        orderBy: { sortOrder: "asc" },
        include: {
          system: true,
          pins: {
            orderBy: { number: "asc" },
            include: {
              product: {
                include: { variants: { where: { active: true }, orderBy: { id: "asc" } } },
              },
            },
          },
        },
      },
    },
  });
};

// El despiece cambia solo cuando el admin edita pines; se cachea una hora.
export const getVehicle = (slug: string) =>
  unstable_cache(() => getVehicleUncached(slug), ["vehiculo", slug], { revalidate: 3600, tags: ["vehiculo", "lamina"] })();

// Carga una lámina concreta ya normalizada para el visor (números como number, no Decimal).
const getDiagramUncached = async (vehicleSlug: string, systemSlug: string): Promise<{
  vehicle: { slug: string; brand: string; model: string; version: string; voltage: string | null; power: string | null };
  diagram: { id: number; title: string; image: string; notes: string | null };
  system: { slug: string; name: string; icon: string };
  pins: DespiecePin[];
  siblings: { slug: string; name: string; icon: string; count: number }[];
} | null> => {
  const vehicle = await prisma.vehicle.findFirst({
    where: { slug: vehicleSlug, active: true },
    include: {
      diagrams: {
        orderBy: { sortOrder: "asc" },
        include: { system: true, _count: { select: { pins: true } } },
      },
    },
  });
  if (!vehicle) return null;

  const target = vehicle.diagrams.find((d) => d.system.slug === systemSlug);
  if (!target) return null;

  const pins = await prisma.diagramPin.findMany({
    where: { diagramId: target.id },
    orderBy: { number: "asc" },
    include: {
      product: { include: { variants: { where: { active: true }, orderBy: { id: "asc" } } } },
    },
  });

  return {
    vehicle: { slug: vehicle.slug, brand: vehicle.brand, model: vehicle.model, version: vehicle.version, voltage: vehicle.voltage, power: vehicle.power },
    diagram: { id: target.id, title: target.title, image: target.image, notes: target.notes },
    system: { slug: target.system.slug, name: target.system.name, icon: target.system.icon },
    pins: pins.map((p) => ({
      id: p.id, number: p.number, x: p.x, y: p.y, svgId: p.svgId, label: p.label,
      product: {
        id: p.product.id, slug: p.product.slug, sku: p.product.sku, name: p.product.name,
        priceUsd: num(p.product.priceUsd), compareAtUsd: p.product.compareAtUsd ? num(p.product.compareAtUsd) : null,
        stock: p.product.stock, packQty: p.product.packQty, image: p.product.images[0] ?? null,
        specs: asSpecs(p.product.specs),
        variants: p.product.variants.map((v) => ({ id: v.id, name: v.name, priceUsd: v.priceUsd ? num(v.priceUsd) : null, stock: v.stock })),
      },
    })),
    siblings: vehicle.diagrams.map((d) => ({ slug: d.system.slug, name: d.system.name, icon: d.system.icon, count: d._count.pins })),
  };
};

export const getDiagram = (vehicleSlug: string, systemSlug: string) =>
  unstable_cache(() => getDiagramUncached(vehicleSlug, systemSlug), ["lamina", vehicleSlug, systemSlug], { revalidate: 3600, tags: ["vehiculo", "lamina"] })();

// Piezas de un vehículo para la tabla completa (todas las láminas de una vez).
export async function getVehicleParts(vehicleId: number) {
  const diagrams = await prisma.vehicleDiagram.findMany({
    where: { vehicleId },
    orderBy: { sortOrder: "asc" },
    include: {
      system: true,
      pins: { orderBy: { number: "asc" }, include: { product: { include: { variants: { where: { active: true } } } } } },
    },
  });
  return diagrams;
}
