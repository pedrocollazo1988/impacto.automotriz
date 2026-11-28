import { PrismaClient } from "@prisma/client";
import { aplicarColumnas } from "./columnas";

const g = globalThis as unknown as { prisma?: PrismaClient };
const base = g.prisma ?? new PrismaClient();

// Las columnas nuevas se crean antes de la primera consulta a los modelos que
// las usan: si se dejara a cada página, cualquier consulta nueva reventaría con
// P2022 en una base sin migrar.
export const asegurarEsquema = () => aplicarColumnas(base);

// Alias histórico: algunas páginas y pruebas lo importan con este nombre.
export const asegurarColumnasProducto = asegurarEsquema;

// El cliente extendido conserva todos los modelos y operaciones; solo pierde
// $on/$use, que aquí no se usan. Se anota como PrismaClient para que los helpers
// que reciben uno (semillas, scripts) sigan aceptándolo sin cambios.
export const prisma = base.$extends({
  query: {
    product: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
    category: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
    paymentGateway: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
    order: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
    customer: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
    otpCode: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
    authSession: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
    staffUser: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
    address: {
      async $allOperations({ args, query }) {
        await asegurarEsquema();
        return query(args);
      },
    },
  },
}) as unknown as PrismaClient;

if (process.env.NODE_ENV !== "production") g.prisma = base;
