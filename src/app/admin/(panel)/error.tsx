"use client";
import { useEffect } from "react";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

export default function Error({ error, reset }: { error: Error & { digest?: string }; reset: () => void }) {
  const { t } = usePreferences();
  useEffect(() => { console.error(error); }, [error]);
  return (
    <div className="adm-panel adm-empty">
      <Icon name="shield" size={34} />
      <p className="font-semibold text-navy">{t("adm.shell.errorTitle")}</p>
      <p className="max-w-md text-sm">{t("adm.shell.errorHint")}</p>
      <button className="btn btn-primary btn-sm mt-2" onClick={reset}>{t("adm.shell.retry")}</button>
    </div>
  );
}
