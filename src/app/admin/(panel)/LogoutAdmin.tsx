"use client";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";
export default function LogoutAdmin() {
  const { t } = usePreferences();
  return <button className="btn btn-ghost btn-sm" onClick={async () => { await fetch("/api/admin/login", { method: "DELETE" }); location.href = "/admin/login"; }}><Icon name="close" size={15} /> {t("adm.shell.logout")}</button>;
}
