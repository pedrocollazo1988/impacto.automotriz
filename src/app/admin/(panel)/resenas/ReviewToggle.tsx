"use client";
import { useRouter } from "next/navigation";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";
export default function ReviewToggle({ id, visible }: { id: number; visible: boolean }) {
  const router = useRouter();
  const { t } = usePreferences();
  return <button className="btn btn-ghost btn-xs" onClick={async () => { await fetch("/api/admin/reviews", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id, visible: !visible }) }); router.refresh(); }}><Icon name={visible ? "close" : "check"} size={12} /> {visible ? t("adm.resenas.hide") : t("adm.resenas.show")}</button>;
}
