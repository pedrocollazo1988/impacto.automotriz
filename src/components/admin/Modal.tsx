"use client";
import type { ReactNode } from "react";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

export type ModalProps = {
  open: boolean;
  title: string;
  onClose: () => void;
  children: ReactNode;
  size?: "sm" | "md" | "lg";
  closeLabel?: string;
};

// Diálogo simple y accesible. Vive en su propio módulo cliente para que
// `ui.tsx` siga sirviendo clases y primitivas a las páginas de servidor.
export default function Modal({ open, title, onClose, children, size = "sm", closeLabel }: ModalProps) {
  const { t } = usePreferences();
  if (!open) return null;
  const ancho = size === "lg" ? "max-w-3xl" : size === "md" ? "max-w-xl" : "max-w-sm";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-[rgb(6_24_51_/_0.55)] backdrop-blur-sm" onClick={onClose} />
      <div className={`relative my-6 w-full ${ancho} rounded-2xl bg-white p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-navy">{title}</h2>
          <button className="btn btn-quiet btn-xs" onClick={onClose} aria-label={closeLabel ?? t("gallery.close")}><Icon name="close" size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
