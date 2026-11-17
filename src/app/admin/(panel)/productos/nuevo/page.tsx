import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";
export const dynamic = "force-dynamic";
export default async function Nuevo() {
  const [c, b] = await Promise.all([prisma.category.findMany(), prisma.brand.findMany()]);
  return <main className="mx-auto max-w-4xl p-6"><h1 className="mb-4 text-2xl font-bold text-navy">Nuevo producto</h1><ProductForm categories={c.map((x) => x.name)} brands={b.map((x) => x.name)} /></main>;
}
