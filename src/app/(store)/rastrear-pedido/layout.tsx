import type { Metadata } from "next";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return {
    title: t("track.metaTitle"),
    description: t("track.metaDescription"),
    robots: { index: false },
  };
}

export default function Layout({ children }: { children: React.ReactNode }) {
  return children;
}
