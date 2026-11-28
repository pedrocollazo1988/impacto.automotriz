import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { getVehicle, getVehiclesCached } from "@/lib/despiece";
import Icon from "@/components/brand/Icon";
import VehiclePicker from "@/components/despiece/VehiclePicker";
import { getT } from "@/lib/i18n";
export const dynamic = "force-dynamic";

type Props = { params: Promise<{ vehiculo: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { t } = await getT();
  const v = await getVehicle((await params).vehiculo);
  if (!v) return {};
  return {
    title: t("parts.vehicleMeta")
      .replace("{brand}", v.brand)
      .replace("{model}", v.model)
      .replace("{version}", v.version),
    description: t("parts.vehicleMetaDesc")
      .replace("{brand}", v.brand)
      .replace("{model}", v.model)
      .replace("{summary}", v.summary ?? "")
      .slice(0, 160),
  };
}

export default async function VehiculoDespiece({ params }: Props) {
  const { t } = await getT();
  const slug = (await params).vehiculo;
  const v = await getVehicle(slug);
  if (!v) notFound();
  const total = v.diagrams.reduce((s, d) => s + d.pins.length, 0);
  const otros = (await getVehiclesCached()).filter((x) => x.slug !== slug);

  return (
    <div className="container-x py-8">
      <nav className="mb-4 flex flex-wrap items-center gap-1.5 text-xs text-slate-500">
        <Link href="/" className="inline-flex min-h-12 items-center hover:text-navy lg:min-h-0">{t("nav.home")}</Link><Icon name="chevronRight" size={12} />
        <Link href="/despiece" className="hover:text-navy">{t("nav.despiece")}</Link><Icon name="chevronRight" size={12} />
        <span className="text-slate-500">{v.brand} {v.model}</span>
      </nav>

      <header className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div className="max-w-2xl">
          <p className="eyebrow text-[color:var(--color-action-deep)]">{v.brand}</p>
          <h1 className="mt-1 font-display text-3xl font-extrabold text-navy sm:text-4xl">{t("parts.heading").replace("{model}", v.model)}</h1>
          <p className="mt-1 font-mono text-xs uppercase tracking-widest text-slate-500">
            {v.version}{v.voltage ? ` · ${v.voltage}` : ""}{v.power ? ` · ${v.power}` : ""}{v.payload ? ` · ${v.payload}` : ""}
          </p>
          {v.summary && <p className="mt-3 text-sm leading-relaxed text-slate-600">{v.summary}</p>}
        </div>
        <div className="flex flex-col items-start gap-2 sm:items-end">
          <VehiclePicker vehicle={{ slug: v.slug, brand: v.brand, model: v.model, version: v.version }} />
          <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">{t("parts.piecesSystems").replace("{n}", String(total)).replace("{m}", String(v.diagrams.length))}</p>
        </div>
      </header>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {v.diagrams.map((d) => {
          const desde = Math.min(...d.pins.map((p) => Number(p.product.priceUsd)));
          const agotadas = d.pins.filter((p) => p.product.stock <= 0).length;
          return (
            <Link key={d.id} href={`/despiece/${v.slug}/${d.system.slug}`} className="adm-panel group flex flex-col transition hover:-translate-y-0.5 hover:shadow-lg">
              <div className="relative overflow-hidden border-b border-slate-100 bg-slate-50">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={d.image} alt={d.title} className="aspect-[3/2] w-full object-cover transition-transform duration-300 group-hover:scale-105" />
                <span className="absolute left-2 top-2 rounded-md bg-[color:var(--color-navy)]/90 px-1.5 py-0.5 font-mono text-[10px] font-bold text-white">
                  {t("parts.piecesCount").replace("{n}", String(d.pins.length))}
                </span>
              </div>
              <div className="flex flex-1 flex-col p-3">
                <h2 className="flex items-center gap-1.5 font-display text-lg font-extrabold leading-tight text-navy">
                  <Icon name={d.system.icon} size={15} className="text-[color:var(--color-action)]" />
                  {d.system.name}
                </h2>
                <p className="mt-1 line-clamp-2 text-xs leading-relaxed text-slate-500">{d.system.blurb || d.notes}</p>
                <div className="mt-auto flex items-center justify-between pt-2 text-[11px]">
                  <span className="font-mono text-slate-500">{t("parts.from")} {desde.toFixed(2)} USD</span>
                  <span className="flex items-center gap-1 font-semibold text-[color:var(--color-action-deep)] group-hover:underline">
                    {t("parts.open")} <Icon name="arrowRight" size={12} />
                  </span>
                </div>
                {agotadas > 0 && (
                  <p className="mt-1 text-[10px] font-semibold text-amber-600">{t("parts.outOfStock").replace("{n}", String(agotadas)).replace("{m}", String(d.pins.length))}</p>
                )}
              </div>
            </Link>
          );
        })}
      </div>

      {otros.length > 0 && (
        <section className="mt-10">
          <h2 className="mb-3 font-display text-lg font-extrabold text-navy">{t("parts.otherVehicles")}</h2>
          <div className="flex flex-wrap gap-2">
            {otros.map((o) => (
              <Link key={o.id} href={`/despiece/${o.slug}`} className="chip">{o.brand} {o.model} · {o.version}</Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
