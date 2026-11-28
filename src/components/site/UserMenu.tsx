"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

type Cliente = { id: string; name: string; avatarUrl: string | null } | null;

const iniciales = (nombre: string) =>
  nombre.trim().split(/\s+/).slice(0, 2).map((p) => p[0]?.toUpperCase() ?? "").join("") || "?";

const primerNombre = (nombre: string) => nombre.trim().split(/\s+/)[0] ?? "";

type Item = { clave: string; icono: string; href?: string; onClick?: () => void; peligro?: boolean };

/**
 * Botón de la cuenta en la cabecera. La sesión se consulta en el navegador
 * para no convertir en dinámicas todas las páginas de la tienda (hoy se
 * prerenderizan); mientras llega, se pinta un hueco del mismo tamaño para que
 * la cabecera no salte.
 */
export default function UserMenu({ variante = "boton" }: { variante?: "boton" | "lista" }) {
  const { t, lang, setLang } = usePreferences();
  const path = usePathname();
  const [cliente, setCliente] = useState<Cliente | undefined>(undefined);
  const [abierto, setAbierto] = useState(false);
  const caja = useRef<HTMLDivElement>(null);
  const disparador = useRef<HTMLButtonElement>(null);
  const items = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    let vivo = true;
    fetch("/api/account/session", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => vivo && setCliente(d && d.id ? d : null))
      .catch(() => vivo && setCliente(null));
    return () => { vivo = false; };
  }, [path]);

  useEffect(() => setAbierto(false), [path]);

  useEffect(() => {
    if (!abierto) return;
    const fuera = (e: MouseEvent) => { if (!caja.current?.contains(e.target as Node)) setAbierto(false); };
    const esc = (e: KeyboardEvent) => { if (e.key === "Escape") { setAbierto(false); disparador.current?.focus(); } };
    document.addEventListener("mousedown", fuera);
    document.addEventListener("keydown", esc);
    return () => { document.removeEventListener("mousedown", fuera); document.removeEventListener("keydown", esc); };
  }, [abierto]);

  if (cliente === undefined) {
    return <span aria-busy="true" aria-label={t("menu.cargando")} className="h-10 w-10 animate-pulse rounded-full bg-slate-200/80 lg:h-11 lg:w-28 lg:rounded-full" />;
  }

  if (!cliente) {
    return (
      <Link
        href="/cuenta"
        className="btn btn-accent inline-flex items-center gap-2 rounded-full px-3 text-sm font-bold shadow-[0_10px_22px_-12px_rgb(14_116_144_/_0.9)] transition hover:shadow-[0_14px_28px_-12px_rgb(14_116_144_/_1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 active:scale-[.98]"
      >
        <Icon name="user" size={18} />
        <span className="hidden sm:inline">{t("menu.entrar")}</span>
      </Link>
    );
  }

  const salir = async () => {
    await fetch("/api/account/session", { method: "DELETE" });
    window.location.href = "/";
  };

  const lista: Item[] = [
    { clave: "menu.perfil", icono: "user", href: "/cuenta#perfil" },
    { clave: "menu.pedidos", icono: "box", href: "/cuenta#pedidos" },
    { clave: "menu.deseos", icono: "heart", href: "/cuenta#deseos" },
    { clave: "menu.direcciones", icono: "pin", href: "/cuenta#direcciones" },
    { clave: "menu.seguridad", icono: "shield", href: "/cuenta#seguridad" },
    { clave: "menu.idioma", icono: "globe", onClick: () => setLang(lang === "es" ? "en" : "es") },
    { clave: "menu.ayuda", icono: "info", href: "/preguntas-frecuentes" },
    { clave: "menu.salir", icono: "logout", onClick: salir, peligro: true },
  ];

  if (variante === "lista") {
    return (
      <div className="flex flex-col">
        <p className="flex items-center gap-2 px-2 py-2 text-sm font-bold text-slate-800">
          <span className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-accent)] text-xs font-bold text-[color:var(--color-on-accent)]">
            {iniciales(cliente.name)}
          </span>
          {cliente.name}
        </p>
        {lista.map((it) => (
          <Fila key={it.clave} item={it} texto={t(it.clave)} lang={lang} />
        ))}
      </div>
    );
  }

  const mover = (i: number) => {
    const visibles = items.current.filter(Boolean) as HTMLElement[];
    if (!visibles.length) return;
    const n = visibles.length;
    visibles[(i + n) % n]?.focus();
  };

  return (
    <div ref={caja} className="relative">
      <button
        ref={disparador}
        type="button"
        aria-haspopup="menu"
        aria-expanded={abierto}
        aria-controls="menu-cuenta"
        aria-label={`${t("menu.abrir")}: ${cliente.name}`}
        onClick={() => setAbierto((v) => !v)}
        onKeyDown={(e) => {
          if (e.key === "ArrowDown" || e.key === "Enter" || e.key === " ") {
            if (!abierto) { e.preventDefault(); setAbierto(true); setTimeout(() => mover(0), 0); }
          }
        }}
        className="flex items-center gap-2 rounded-full border-2 border-[color:var(--color-accent)]/45 bg-white py-1 pl-1 pr-2.5 shadow-[0_10px_22px_-14px_rgb(14_116_144_/_1)] transition hover:border-[color:var(--color-accent)]/80 hover:bg-[color:var(--color-accent-soft)] hover:shadow-[0_14px_28px_-14px_rgb(14_116_144_/_1)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] focus-visible:ring-offset-2 active:scale-[.98]"
      >
        {cliente.avatarUrl ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img src={cliente.avatarUrl} alt="" width={34} height={34} className="h-8 w-8 rounded-full object-cover ring-2 ring-white" />
        ) : (
          <span aria-hidden className="grid h-8 w-8 place-items-center rounded-full bg-[color:var(--color-accent)] text-xs font-extrabold text-[color:var(--color-on-accent)]">
            {iniciales(cliente.name)}
          </span>
        )}
        <span className="hidden max-w-[7.5rem] truncate text-sm font-bold text-navy lg:block">{primerNombre(cliente.name)}</span>
        <Icon name="chevronDown" size={16} className={`hidden text-[color:var(--color-accent)] transition-transform lg:block ${abierto ? "rotate-180" : ""}`} />
      </button>

      {abierto && (
        <div
          id="menu-cuenta"
          role="menu"
          aria-label={t("menu.aria")}
          aria-orientation="vertical"
          className="absolute right-0 z-50 mt-2 w-64 overflow-hidden rounded-2xl border border-slate-200 bg-white p-1.5 shadow-[0_24px_48px_-20px_rgb(2_27_72_/_0.45)]"
          onKeyDown={(e) => {
            const activos = items.current.filter(Boolean) as HTMLElement[];
            const i = activos.indexOf(document.activeElement as HTMLElement);
            if (e.key === "ArrowDown") { e.preventDefault(); mover(i + 1); }
            else if (e.key === "ArrowUp") { e.preventDefault(); mover(i - 1); }
            else if (e.key === "Home") { e.preventDefault(); mover(0); }
            else if (e.key === "End") { e.preventDefault(); mover(activos.length - 1); }
            else if (e.key === "Tab") { setAbierto(false); }
          }}
        >
          <p className="px-3 py-2 text-sm font-bold text-slate-800">{cliente.name}</p>
          {lista.map((it, i) => (
            <Fila key={it.clave} item={it} texto={it.clave === "menu.idioma" ? `${t(it.clave)}: ${lang === "es" ? "Español" : "English"}` : t(it.clave)} lang={lang} menu ref={(el) => { items.current[i] = el; }} onElegir={() => setAbierto(false)} />
          ))}
        </div>
      )}
    </div>
  );
}

function Fila({
  item, texto, lang, menu, peligro, ref, onElegir,
}: {
  item: Item; texto: string; lang: string; menu?: boolean; peligro?: boolean;
  ref?: (el: HTMLElement | null) => void; onElegir?: () => void;
}) {
  const esPeligro = peligro ?? item.peligro;
  const clases = `flex min-h-10 w-full items-center gap-2.5 rounded-xl px-3 text-sm font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] ${
    esPeligro ? "text-red-600 hover:bg-red-50" : "text-slate-700 hover:bg-[color:var(--color-accent-soft)] hover:text-[color:var(--color-accent-hover)]"
  } ${item.peligro ? "mt-1 border-t border-slate-100 pt-2" : ""}`;
  const contenido = (<><Icon name={item.icono} size={16} /> {texto}</>);

  if (item.href) {
    return (
      <Link href={item.href} role={menu ? "menuitem" : undefined} ref={ref as never} className={clases} onClick={onElegir} lang={lang}>
        {contenido}
      </Link>
    );
  }
  return (
    <button type="button" role={menu ? "menuitem" : undefined} ref={ref as never} className={`${clases} text-left`} onClick={() => { item.onClick?.(); onElegir?.(); }}>
      {contenido}
    </button>
  );
}
