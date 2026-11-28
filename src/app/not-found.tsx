import Link from "next/link";
import type { Metadata } from "next";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";
import { getT } from "@/lib/i18n";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("nf.metaTitle") };
}

export default async function NotFound() {
  const { t } = await getT();
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <Logo size="md" className="mx-auto" />
        <p className="mt-8 font-display text-7xl font-extrabold text-navy">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-navy">{t("nf.title")}</h1>
        <p className="mt-3 text-slate-500">{t("nf.text")}</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">{t("nf.home")}</Link>
          <Link href="/catalogo" className="btn btn-ghost"><Icon name="search" size={16} /> {t("nf.catalog")}</Link>
        </div>
      </div>
    </div>
  );
}
