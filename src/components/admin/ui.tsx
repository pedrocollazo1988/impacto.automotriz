import type { ReactNode } from "react";
import Icon from "@/components/brand/Icon";

// Primitivas compartidas del panel. Sin estado propio: sirven igual en
// componentes de servidor y de cliente.

export function PageHeader({ title, subtitle, actions }: { title: string; subtitle?: string; actions?: ReactNode }) {
  return (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
      <div>
        <h1 className="adm-h1">{title}</h1>
        {subtitle && <p className="adm-sub mt-0.5">{subtitle}</p>}
      </div>
      {actions && <div className="adm-toolbar">{actions}</div>}
    </div>
  );
}

export function Panel({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`adm-panel ${className}`}>{children}</div>;
}

export function PanelPad({ children, className = "" }: { children: ReactNode; className?: string }) {
  return <div className={`adm-panel adm-panel-pad ${className}`}>{children}</div>;
}

type Tone = "ok" | "warn" | "info" | "danger" | "mute";
export function Badge({ tone = "mute", children }: { tone?: Tone; children: ReactNode }) {
  return <span className={`badge badge-${tone}`}>{children}</span>;
}

export function EmptyState({ icon = "info", title, hint }: { icon?: string; title: string; hint?: string }) {
  return (
    <div className="adm-empty">
      <Icon name={icon} size={30} />
      <p className="font-semibold text-navy">{title}</p>
      {hint && <p className="text-sm">{hint}</p>}
    </div>
  );
}

export function Field({ label, hint, children }: { label: string; hint?: string; children: ReactNode }) {
  return (
    <label className="block space-y-1">
      <span className="text-xs font-semibold text-slate-600">{label}</span>
      {children}
      {hint && <span className="block text-xs text-slate-400">{hint}</span>}
    </label>
  );
}

// Clases reutilizables para no repetir la cadena en cada formulario.
export const inputCls = "input";
export const inputSmCls = "input input-sm";

// Diálogo simple y accesible. Se usa en lugar de prompt()/confirm() nativos.
export function Modal({ open, title, onClose, children, size = "sm" }: { open: boolean; title: string; onClose: () => void; children: ReactNode; size?: "sm" | "md" | "lg" }) {
  if (!open) return null;
  const ancho = size === "lg" ? "max-w-3xl" : size === "md" ? "max-w-xl" : "max-w-sm";
  return (
    <div className="fixed inset-0 z-50 grid place-items-center overflow-y-auto p-4" role="dialog" aria-modal="true" aria-label={title}>
      <div className="fixed inset-0 bg-[rgb(6_24_51_/_0.55)] backdrop-blur-sm" onClick={onClose} />
      <div className={`relative my-6 w-full ${ancho} rounded-2xl bg-white p-5 shadow-[0_30px_60px_-20px_rgba(0,0,0,0.5)]`}>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-base font-bold text-navy">{title}</h2>
          <button className="btn btn-quiet btn-xs" onClick={onClose} aria-label="Cerrar"><Icon name="close" size={16} /></button>
        </div>
        {children}
      </div>
    </div>
  );
}
