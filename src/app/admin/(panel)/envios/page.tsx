import ZoneRulesEditor from "@/components/ZoneRulesEditor";
import { PageHeader } from "@/components/admin/ui";
export default function Page() {
  return (
    <>
      <PageHeader title="Entregas y zonas" subtitle="Activa métodos y tarifas por provincia o municipio" />
      <ZoneRulesEditor />
    </>
  );
}
