import ResetForm from "./ResetForm";
import { getT } from "@/lib/i18n";
export async function generateMetadata() {
  const { t } = await getT();
  return { title: t("reset.metaTitle"), robots: { index: false } };
}
export default async function Page({ searchParams }: { searchParams: Promise<{ token?: string }> }) { return <ResetForm token={(await searchParams).token ?? ""} />; }
