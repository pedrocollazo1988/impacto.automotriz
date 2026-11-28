import { prisma } from "@/lib/prisma";
import ProductForm from "../ProductForm";
import { PageHeader, PanelPad } from "@/components/admin/ui";
import { getT } from "@/lib/i18n";
export const dynamic = "force-dynamic";
export default async function Nuevo() {
  const { t } = await getT();
  const [c, b] = await Promise.all([prisma.category.findMany(), prisma.brand.findMany()]);
  return (
    <>
      <PageHeader title={t("adm.prod.new")} subtitle={t("adm.prod.newSubtitle")} />
      <PanelPad><ProductForm categories={c.map((x) => x.name)} brands={b.map((x) => x.name)} blob={!!process.env.BLOB_READ_WRITE_TOKEN} /></PanelPad>
    </>
  );
}
