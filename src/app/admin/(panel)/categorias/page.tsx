import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/auth";
import CategoriasAdmin from "@/components/admin/CategoriasAdmin";

export const dynamic = "force-dynamic";
export const metadata = { title: "Categorías" };

export default async function CategoriasPage() {
  await requirePage("products");
  const categorias = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return <CategoriasAdmin iniciales={categorias} />;
}
