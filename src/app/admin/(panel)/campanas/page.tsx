import CampaignsAdmin from "@/components/CampaignsAdmin";
import { PageHeader } from "@/components/admin/ui";
export default function Page() {
  return (
    <>
      <PageHeader title="Email marketing" subtitle="Crea campañas y envíalas a tus segmentos" />
      <CampaignsAdmin />
    </>
  );
}
