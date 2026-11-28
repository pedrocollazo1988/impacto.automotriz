"use client";
import { usePreferences } from "@/components/site/Preferences";
export default function LogoutButton() { const { t } = usePreferences(); return <button className="text-sm text-slate-600 underline" onClick={async () => { await fetch("/api/account/session", { method: "DELETE" }); location.href = "/"; }}>{t("account.logout")}</button>; }
