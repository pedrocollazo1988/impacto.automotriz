import { PrismaClient } from "@prisma/client";
import { aplicarColumnas } from "./columnas";

const g = globalThis as unknown as { prisma?: PrismaClient };
const base = g.prisma ?? new PrismaClient();

// Las columnas nuevas se crean antes de la primera consulta a Product o
// Category: si se dejara a cada página, cualquier consulta nueva (portada,
// catálogo, buscador) reventaría con P2022 en una base sin migrar.
export const asegurarColumnasProducto = () => aplicarColumnas(base);

// El cliente extendido conserva todos los modelos y operaciones; solo pierde
// $on/$use, que aquí no se usan. Se anota como PrismaClient para que los helpers
// que reciben uno (semillas, scripts) sigan aceptándolo sin cambios.
export const prisma = base.$extends({
  query: {
    product: {
      async $allOperations({ args, query }) {
        await asegurarColumnasProducto();
        return query(args);
      },
    },
    category: {
      async $allOperations({ args, query }) {
        await asegurarColumnasProducto();
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") g.prisma = base;
