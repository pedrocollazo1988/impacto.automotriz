import type { Metadata } from "next";
import { prisma } from "@/lib/prisma";
import { requirePage } from "@/lib/auth";
import { getT } from "@/lib/i18n";
import CategoriasAdmin from "@/components/admin/CategoriasAdmin";

export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("adm.cat.title") };
}

export default async function CategoriasPage() {
  await requirePage("products");
  const categorias = await prisma.category.findMany({
    orderBy: [{ position: "asc" }, { name: "asc" }],
    include: { _count: { select: { products: true } } },
  });
  return <CategoriasAdmin iniciales={categorias} />;
}
