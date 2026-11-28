"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";
import {
  contarPorEstado, estadosVisibles, filtrarPedidos, FILTRO_VACIO, type EstadoPedido, type FiltroPedidos,
} from "@/lib/pedidos";

export type PedidoCuenta = { id: string; number: number; status: string; createdAt: string; totalUsd: number };

const CLASE: Record<string, string> = {
  PENDING_PAYMENT: "bg-amber-100 text-amber-700",
  PAID: "bg-blue-100 text-blue-700",
  PREPARING: "bg-indigo-100 text-indigo-700",
  SHIPPED: "bg-violet-100 text-violet-700",
  DELIVERED: "bg-green-100 text-green-700",
  CANCELED: "bg-slate-200 text-slate-600",
};

const PLAZO = [null, 30, 90] as const;

export default function PedidosCuenta({ pedidos }: { pedidos: PedidoCuenta[] }) {
  const { t, lang } = usePreferences();
  const [filtro, setFiltro] = useState<FiltroPedidos>(FILTRO_VACIO);
  const cuenta = useMemo(() => contarPorEstado(pedidos), [pedidos]);
  const visibles = useMemo(() => filtrarPedidos(pedidos, filtro), [pedidos, filtro]);
  const pestañas = useMemo(() => estadosVisibles(cuenta, filtro.estado), [cuenta, filtro.estado]);
  const etiqueta = (e: EstadoPedido) => t(`ord.st.${e}`);
  const aplica = (parcial: Partial<FiltroPedidos>) => setFiltro((f) => ({ ...f, ...parcial }));

  const chip = (activo: boolean) =>
    `inline-flex min-h-9 items-center gap-1.5 rounded-full border px-3 text-xs font-semibold transition focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[color:var(--color-accent)] ${
      activo
        ? "border-[color:var(--color-accent)] bg-[color:var(--color-accent)] text-[color:var(--color-on-accent)]"
        : "border-slate-200 bg-white text-slate-600 hover:border-[color:var(--color-accent)]/60 hover:text-[color:var(--color-accent-hover)]"
    }`;

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative min-w-48 flex-1">
          <Icon name="search" size={16} className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            className="input pl-9"
            value={filtro.texto}
            onChange={(e) => aplica({ texto: e.target.value })}
            placeholder={t("ord.search")}
            aria-label={t("ord.search")}
            inputMode="numeric"
          />
        </div>
        <label className="flex items-center gap-2 text-xs font-semibold text-slate-500">
          <span className="sr-only">{t("ord.range")}</span>
          <select
            className="input input-select w-auto"
            value={filtro.desdeDias ?? ""}
            onChange={(e) => aplica({ desdeDias: e.target.value === "" ? null : Number(e.target.value) })}
            aria-label={t("ord.range")}
          >
            {PLAZO.map((d) => (
              <option key={String(d)} value={d ?? ""}>{d === null ? t("ord.all") : d === 30 ? t("ord.days30") : t("ord.days90")}</option>
            ))}
          </select>
        </label>
      </div>

      <div role="tablist" aria-label={t("ord.tabAll")} className="flex flex-wrap gap-2">
        <button type="button" role="tab" aria-selected={filtro.estado === "TODOS"} className={chip(filtro.estado === "TODOS")} onClick={() => aplica({ estado: "TODOS" })}>
          {t("ord.tabAll")} <span className="opacity-70">{cuenta.TODOS}</span>
        </button>
        {pestañas.map((e) => (
          <button key={e} type="button" role="tab" aria-selected={filtro.estado === e} className={chip(filtro.estado === e)} onClick={() => aplica({ estado: e })}>
            {etiqueta(e)} <span className="opacity-70">{cuenta[e] ?? 0}</span>
          </button>
        ))}
      </div>

      {visibles.length === 0 ? (
        <p className="text-sm text-slate-500">{t("ord.none")}</p>
      ) : (
        <div className="space-y-3">
          {visibles.map((o) => (
            <Link key={o.id} href={`/pedido/${o.id}`} className="card card-hover flex flex-wrap items-center gap-4 p-4">
              <span className="grid h-11 w-11 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="box" size={20} /></span>
              <div className="min-w-0 flex-1">
                <p className="font-semibold text-slate-800">Pedido #{o.number}</p>
                <p className="text-xs text-slate-400">{new Date(o.createdAt).toLocaleDateString(lang === "en" ? "en-GB" : "es-CU")}</p>
              </div>
              <span className={`badge ${CLASE[o.status] ?? "bg-slate-100 text-slate-600"}`}>{t(`ord.st.${o.status}`)}</span>
              <span className="font-display font-extrabold text-navy">{o.totalUsd.toFixed(2)} USD</span>
              <span className="text-xs font-semibold text-[color:var(--color-accent-hover)]">{t("ord.detail")}</span>
              <Icon name="chevronRight" size={18} className="text-slate-300" />
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
