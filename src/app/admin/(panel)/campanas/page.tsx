import CampaignsAdmin from "@/components/CampaignsAdmin";
import EmailSettingsForm from "@/components/admin/EmailSettingsForm";
import { PageHeader } from "@/components/admin/ui";
export default function Page() {
  return (
    <>
      <PageHeader title="Email marketing" subtitle="Configura el correo y envía campañas a tus segmentos" />
      <EmailSettingsForm />
      <CampaignsAdmin />
    </>
  );
}
