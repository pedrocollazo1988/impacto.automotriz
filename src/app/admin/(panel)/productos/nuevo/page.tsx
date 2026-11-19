import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";
import { PageHeader, PanelPad } from "@/components/admin/ui";
export const dynamic = "force-dynamic";
export default async function Nuevo() {
  const [c, b] = await Promise.all([prisma.category.findMany(), prisma.brand.findMany()]);
  return (
    <>
      <PageHeader title="Nuevo producto" subtitle="Rellena la ficha; se publicará en la tienda al guardar" />
      <PanelPad><ProductForm categories={c.map((x) => x.name)} brands={b.map((x) => x.name)} /></PanelPad>
    </>
  );
}
