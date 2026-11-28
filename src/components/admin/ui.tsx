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

// El modal es cliente (usa el idioma del panel), pero se reexporta aquí para
// conservar el mismo punto de importación en las páginas de servidor.
export { default as Modal, type ModalProps } from "./Modal";
