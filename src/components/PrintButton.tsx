"use client";
import { usePreferences } from "@/components/site/Preferences";
export default function PrintButton() { const { t } = usePreferences(); return <button onClick={() => window.print()} className="rounded bg-navy px-4 py-2 text-sm text-white print:hidden">{t("order.print")}</button>; }
