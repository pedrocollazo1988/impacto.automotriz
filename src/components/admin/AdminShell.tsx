"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/brand/Icon";
import Logo from "@/components/brand/Logo";
import LogoutAdmin from "@/app/admin/(panel)/LogoutAdmin";
import AdminThemeSwitch from "@/components/admin/AdminThemeSwitch";
import { LanguageToggle, usePreferences } from "@/components/site/Preferences";

export type NavLink = { href: string; label: string; icon: string; exact?: boolean };

export default function AdminShell({ links, userName, role, children }: { links: NavLink[]; userName: string; role: string; children: React.ReactNode }) {
  const path = usePathname();
  const { t } = usePreferences();
  const [open, setOpen] = useState(false);
  useEffect(() => { setOpen(false); }, [path]);

  const isActive = (l: NavLink) => (l.exact ? path === l.href : path === l.href || path.startsWith(l.href + "/"));
  const current = [...links].sort((a, b) => b.href.length - a.href.length).find(isActive);
  const initials = userName.split(/\s+/).map((w) => w[0]).slice(0, 2).join("").toUpperCase() || "?";

  return (
    <div className="adm-shell">
      {open && <div className="adm-scrim lg:hidden" onClick={() => setOpen(false)} aria-hidden />}
      <aside className="adm-sidebar" data-open={open} aria-label={t("adm.shell.nav")}>
        <div className="adm-sidebar-brand flex-col items-start gap-1">
          <Logo variant="light" size="sm" href="/admin" tagline={false} className="[&_.font-display]:text-[12px] [&_.font-display]:tracking-tight" />
          <span className="pl-1 font-mono text-[10px] uppercase tracking-[0.2em] text-white/50">{t("adm.shell.tagline")}</span>
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
          <button className="btn btn-ghost btn-sm lg:hidden" onClick={() => setOpen((v) => !v)} aria-label={t("adm.shell.openMenu")} aria-expanded={open}>
            <Icon name={open ? "close" : "menu"} size={18} />
          </button>
          <span className="lg:hidden"><Logo variant="dark" size="sm" href="/admin" tagline={false} className="[&_.font-display]:hidden sm:[&_.font-display]:block sm:[&_.font-display]:text-[12px]" /></span>
          <span className="hidden font-display text-sm font-bold text-navy lg:inline">{current?.label ?? t("adm.shell.title")}</span>
          <div className="ml-auto flex items-center gap-2">
            <div className="flex items-center rounded-xl border border-slate-200 bg-slate-50 p-0.5 text-slate-600 [&>button]:h-8 [&>button]:min-h-8">
              <LanguageToggle />
            </div>
            <AdminThemeSwitch />
            <Link href="/" className="btn btn-ghost btn-sm"><Icon name="cart" size={15} /> {t("adm.shell.viewStore")}</Link>
            <LogoutAdmin />
          </div>
        </header>
        <main className="adm-main">{children}</main>
      </div>
    </div>
  );
}
