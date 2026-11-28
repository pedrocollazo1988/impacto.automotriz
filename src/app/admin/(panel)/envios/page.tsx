import ZoneRulesEditor from "@/components/ZoneRulesEditor";
import { PageHeader } from "@/components/admin/ui";
import { getT } from "@/lib/i18n";
export default async function Page() {
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("adm.envios.title")} subtitle={t("adm.envios.subtitle")} />
      <ZoneRulesEditor />
    </>
  );
}
