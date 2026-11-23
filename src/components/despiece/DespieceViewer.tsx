"use client";
import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { useCart } from "@/components/CartProvider";
import { useVehicle } from "@/components/VehicleProvider";
import type { DespiecePin } from "@/lib/despiece";

type Props = { vehicleSlug: string; image: string; pins: DespiecePin[] };

const money = (n: number) => n.toFixed(2);

export default function DespieceViewer({ vehicleSlug, image, pins }: Props) {
  const [activo, setActivo] = useState<number | null>(null);
  const [zoom, setZoom] = useState(false);
  const [origen, setOrigen] = useState({ x: 50, y: 50 });
  const itemRefs = useRef<Record<number, HTMLLIElement | null>>({});
  const { items, add } = useCart();
  const { vehicle } = useVehicle();
  const compatible = vehicle?.slug === vehicleSlug;

  const seleccionar = useCallback((id: number, desplazar = true) => {
    setActivo(id);
    const pin = pins.find((p) => p.id === id);
    if (pin) setOrigen({ x: pin.x, y: pin.y });
    if (desplazar) itemRefs.current[id]?.scrollIntoView({ behavior: "smooth", block: "nearest" });
    if (pin?.product.sku) {
      const url = new URL(window.location.href);
      url.searchParams.set("pieza", pin.product.sku);
      window.history.replaceState(null, "", url.toString());
    }
  }, [pins]);

  // Enlace directo: /despiece/kvitova-dds-od/frenos?pieza=KVI-FRE-01 abre con la pieza marcada.
  useEffect(() => {
    const sku = new URLSearchParams(window.location.search).get("pieza");
    if (!sku) return;
    const p = pins.find((x) => x.product.sku === sku);
    if (p) seleccionar(p.id, false);
  }, [pins, seleccionar]);

  const total = useMemo(() => pins.reduce((s, p) => s + (p.product.stock > 0 ? p.product.priceUsd : 0), 0), [pins]);

  return (
    <div className="grid gap-6 lg:grid-cols-12 lg:items-start">
      <div className="lg:col-span-7 lg:sticky lg:top-[calc(var(--sticky-top,80px)+12px)]">
        <div className="adm-panel overflow-hidden">
          <div className="flex items-center justify-between gap-2 border-b border-slate-100 px-3 py-2">
            <p className="flex items-center gap-1.5 font-mono text-[11px] uppercase tracking-widest text-slate-400">
              <Icon name="ruler" size={13} /> Toca un número para ver la pieza
            </p>
            <button onClick={() => setZoom((z) => !z)} className="btn btn-ghost btn-xs" aria-pressed={zoom}>
              <Icon name="search" size={13} /> {zoom ? "Reducir" : "Ampliar"}
            </button>
          </div>
          <div className="relative bg-white">
            <div
              className={`relative w-full overflow-hidden ${zoom ? "cursor-zoom-out" : "cursor-zoom-in"}`}
              style={{ aspectRatio: "3 / 2" }}
              onClick={() => setZoom((z) => !z)}
            >
              {/* La imagen y los pines comparten el mismo contenedor para que el
                  zoom los escale juntos; si solo escalara la imagen, los pines
                  se quedarían donde estaban y dejarían de marcar su número. */}
              <div
                className="relative h-full w-full transition-transform duration-300 ease-out"
                style={{ transform: zoom ? "scale(2.1)" : "none", transformOrigin: `${origen.x}% ${origen.y}%` }}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={image}
                  alt="Diagrama de despiece del vehículo"
                  className="h-full w-full object-contain"
                  draggable={false}
                />
                {pins.map((p) => {
                  const esActivo = activo === p.id;
                  return (
                    <button
                      key={p.id}
                      onClick={(e) => { e.stopPropagation(); seleccionar(p.id); }}
                      onMouseEnter={() => setActivo(p.id)}
                      style={{ left: `${p.x}%`, top: `${p.y}%` }}
                      aria-label={`Pieza ${p.number}: ${p.label ?? p.product.name}`}
                      aria-current={esActivo ? "true" : undefined}
                      className={`absolute grid h-8 w-8 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full transition focus:outline-none focus-visible:ring-4 focus-visible:ring-[color:var(--color-action)]/40 ${
                        esActivo
                          ? "z-20 bg-[color:var(--color-action-hi)]/25 ring-2 ring-[color:var(--color-action-hi)]"
                          : "z-10 bg-transparent hover:bg-[color:var(--color-action)]/15 hover:ring-2 hover:ring-[color:var(--color-action)]/50"
                      }`}
                    >
                      {/* El número ya lo dibuja la lámina; el pin solo lo hace táctil. */}
                      <span className="sr-only">{p.number}</span>
                    </button>
                  );
                })}
              </div>
            </div>
          </div>
        </div>
        <p className="mt-2 flex items-center gap-1.5 text-[11px] text-slate-400">
          <Icon name="info" size={12} /> Los números siguen la tabla de al lado. Medidas y voltaje están en cada ficha.
        </p>
      </div>

      <div className="lg:col-span-5">
        {compatible && (
          <p className="mb-3 flex items-center gap-2 rounded-xl border border-[color:var(--color-ok)]/30 bg-[color:var(--color-ok)]/8 px-3 py-2 text-xs font-semibold text-emerald-700">
            <Icon name="check" size={14} /> Estas piezas corresponden a tu {vehicle?.brand} {vehicle?.model}
          </p>
        )}
        <div className="adm-panel">
          <div className="flex items-center justify-between border-b border-slate-100 px-3 py-2">
            <p className="font-mono text-[11px] uppercase tracking-widest text-slate-400">{pins.length} piezas en esta lámina</p>
            <span className="font-mono text-[11px] text-slate-400">desde {money(Math.min(...pins.map((p) => p.product.priceUsd)))} USD</span>
          </div>
          <ul className="max-h-[74vh] divide-y divide-slate-100 overflow-y-auto">
            {pins.map((p) => {
              const esActivo = activo === p.id;
              const prod = p.product;
              const enCarritoDe = (vId: number | null) => items.filter((i) => i.productId === prod.id && (i.variantId ?? null) === vId).reduce((s, i) => s + i.qty, 0);
              const stockDe = (v: { stock: number }) => Math.min(prod.stock, v.stock);
              const variante = prod.variants.find((v) => stockDe(v) > enCarritoDe(v.id));
              const stock = prod.variants.length ? (variante ? stockDe(variante) : 0) : prod.stock;
              const enCarrito = enCarritoDe(variante?.id ?? null);
              const agotado = stock <= 0 || enCarrito >= stock;
              return (
                <li
                  key={p.id}
                  ref={(el) => { itemRefs.current[p.id] = el; }}
                  onMouseEnter={() => setActivo(p.id)}
                  className={`transition-colors ${esActivo ? "bg-[color:var(--color-action-hi)]/10" : "hover:bg-slate-50"}`}
                >
                  <div className="flex items-start gap-3 p-3">
                    <span className={`mt-0.5 grid h-7 w-7 shrink-0 place-items-center rounded-full text-[11px] font-bold ${esActivo ? "bg-[color:var(--color-action-hi)] text-[color:var(--color-navy-deep)]" : "bg-[color:var(--color-navy)] text-white"}`}>
                      {p.number}
                    </span>
                    <div className="min-w-0 flex-1">
                      <Link href={`/producto/${prod.slug}`} className="block text-sm font-bold leading-tight text-navy hover:underline">
                        {prod.name}
                      </Link>
                      <p className="mt-0.5 font-mono text-[11px] text-slate-400">{prod.sku}</p>
                      <dl className="mt-1.5 flex flex-wrap gap-x-3 gap-y-0.5 text-[11px] text-slate-500">
                        {Object.entries(prod.specs).slice(0, 3).map(([k, v]) => (
                          <div key={k} className="flex gap-1"><dt className="text-slate-400">{k}:</dt><dd className="font-medium">{v}</dd></div>
                        ))}
                      </dl>
                      {prod.packQty != null && prod.packQty > 1 && (
                        <p className="mt-1 inline-flex items-center gap-1 rounded-md bg-[color:var(--color-action)]/10 px-1.5 py-0.5 text-[10px] font-semibold text-[color:var(--color-action-deep)]">
                          <Icon name="box" size={10} /> Se vende en juego de {prod.packQty}
                        </p>
                      )}
                    </div>
                    <div className="shrink-0 text-right">
                      <p className="font-display text-base font-extrabold text-navy">{money(prod.priceUsd)} <span className="text-[10px] font-bold text-slate-400">USD</span></p>
                      <p className={`mt-0.5 text-[10px] font-semibold ${agotado ? "text-red-700" : "text-emerald-700"}`}>
                        {agotado ? "Agotado" : `${Math.max(0, stock - enCarrito)} disp.`}
                      </p>
                      <button
                        disabled={agotado}
                        onClick={() => add(prod.id, 1, variante?.id ?? null, stock)}
                        className="btn btn-primary btn-xs mt-1.5 disabled:opacity-40"
                      >
                        <Icon name="cart" size={12} /> Añadir
                      </button>
                    </div>
                  </div>
                </li>
              );
            })}
          </ul>
          <div className="flex items-center justify-between gap-2 border-t border-slate-100 bg-slate-50/60 px-3 py-2">
            <span className="text-[11px] text-slate-500">Valor de la lámina completa</span>
            <span className="font-mono text-xs font-bold text-navy">{money(total)} USD</span>
          </div>
        </div>
      </div>
    </div>
  );
}
