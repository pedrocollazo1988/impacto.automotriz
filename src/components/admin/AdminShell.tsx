"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/brand/Icon";
import LogoutAdmin from "@/app/admin/(panel)/LogoutAdmin";

export type NavLink = { href: string; label: string; icon: string; exact?: boolean };

export default function AdminShell({ links, userName, role, children }: { links: NavLink[]; userName: string; role: string; children: React.ReactNode }) {
  const path = usePathname();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);

  const isActive = (l: NavLink) => (l.exact ? path === l.href : path === l.href || path.startsWith(l.href + "/"));
  const current = [...links].sort((a, b) => b.href.length - a.href.length).find(isActive);
  const initials = userName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="adm-shell">
      {open && <div className="adm-scrim lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside className="adm-sidebar" data-open={open} aria-label="Navegación del panel">
        <div className="adm-sidebar-brand">
          <span className="adm-avatar" style={{ background: "linear-gradient(180deg,#164a8a,#0a2c5e)" }}>IA</span>
          <span className="flex flex-col leading-tight">
            <span className="font-display text-sm font-extrabold tracking-tight">IMPACTO<span className="text-[color:var(--color-action-hi)]">·</span>AUTOMOTRIZ</span>
            <span className="font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">Panel de gestión</span>
          </span>
        </div>
        <nav className="adm-nav">
          {links.map((l) => (
            <Link key={l.href} href={l.href} className="adm-navlink" aria-current={isActive(l) ? "page" : undefined}>
              <Icon name={l.icon} size={17} /> {l.label}
            </Link>
          ))}
        </nav>
        <div className="adm-user">
          <span className="adm-avatar">{initials}</span>
          <span className="flex min-w-0 flex-col leading-tight">
            <span className="truncate text-sm font-semibold">{userName}</span>
            <span className="text-[11px] uppercase tracking-wider text-white/55">{role}</span>
          </span>
        </div>
      </aside>

      <div className="adm-content">
        <header className="adm-topbar">
          <button className="btn btn-ghost btn-sm lg:hidden" onClick={() => setOpen((v) => !v)} aria-label="Abrir menú" aria-expanded={open}>
            <Icon name={open ? "close" : "menu"} size={18} />
          </button>
          <span className="font-display text-sm font-bold text-navy">{current?.label ?? "Panel"}</span>
          <div className="ml-auto flex items-center gap-2">
            <Link href="/" className="btn btn-ghost btn-sm"><Icon name="cart" size={15} /> Ver tienda</Link>
            <LogoutAdmin />
          </div>
        </header>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
