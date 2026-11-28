import CampaignsAdmin from "@/components/CampaignsAdmin";
import EmailSettingsForm from "@/components/admin/EmailSettingsForm";
import { PageHeader } from "@/components/admin/ui";
import { getT } from "@/lib/i18n";
export default async function Page() {
  const { t } = await getT();
  return (
    <>
      <PageHeader title={t("adm.campanas.title")} subtitle={t("adm.campanas.subtitle")} />
      <EmailSettingsForm />
      <CampaignsAdmin />
    </>
  );
}
