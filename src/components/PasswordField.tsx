"use client";
import { useState, type InputHTMLAttributes } from "react";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

type Props = Omit<InputHTMLAttributes<HTMLInputElement>, "type"> & { inputClassName?: string };

/** Campo de contraseña con botón para mostrar u ocultar el valor. */
export default function PasswordField({ className = "", inputClassName = "input", ...props }: Props) {
  const { t } = usePreferences();
  const [visible, setVisible] = useState(false);
  return (
    <div className={`relative ${className}`}>
      <input {...props} type={visible ? "text" : "password"} className={`${inputClassName} pr-12`} />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        aria-label={visible ? t("auth2.hidePassword") : t("auth2.showPassword")}
        aria-pressed={visible}
        className="absolute inset-y-0 right-0 grid w-12 place-items-center rounded-r-xl text-slate-500 transition hover:text-navy focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-action)]/40"
      >
        <Icon name={visible ? "eyeOff" : "eye"} size={18} />
      </button>
    </div>
  );
}
