import Link from "next/link";
import type { Metadata } from "next";
import { getVehiclesConLaminasCached } from "@/lib/despiece";
import Icon from "@/components/brand/Icon";
import VehiclePicker from "@/components/despiece/VehiclePicker";
import { leerSeccion } from "@/lib/contenido-server";
import { getT } from "@/lib/i18n";
export const dynamic = "force-dynamic";

export async function generateMetadata(): Promise<Metadata> {
  const { t } = await getT();
  return { title: t("parts.meta"), description: t("parts.metaDesc") };
}

export default async function DespieceIndex() {
  const { t } = await getT();
  const [vehicles, hero] = await Promise.all([getVehiclesConLaminasCached(), leerSeccion("despiece-hero")]);

  if (vehicles.length === 0) {
    return (
      <div className="container-x py-16">
        <div className="adm-empty">
          <Icon name="layers" size={40} />
          <h1 className="font-display text-2xl font-extrabold text-navy">{t("parts.emptyTitle")}</h1>
          <p className="text-sm">{t("parts.emptyText")}</p>
          <Link href="/catalogo" className="btn btn-primary mt-3">{t("parts.viewCatalog")}</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container-x py-10">
      <header className="mb-8 max-w-2xl">
        <p className="eyebrow text-[color:var(--color-action-deep)]">{hero.eyebrow}</p>
        <h1 className="mt-1 font-display text-3xl font-extrabold text-navy sm:text-4xl">{hero.title}</h1>
        <p className="mt-2 text-slate-600">{hero.subtitle}</p>
      </header>

      <div className="grid gap-5 md:grid-cols-2">
        {vehicles.map((v) => {
          const piezas = v.diagrams.reduce((s, x) => s + x._count.pins, 0);
          return (
            <article key={v.id} className="adm-panel">
              <div className="flex flex-wrap items-start justify-between gap-3 border-b border-slate-100 p-4">
                <div>
                  <p className="font-mono text-[11px] uppercase tracking-widest text-slate-500">{v.brand}</p>
                  <h2 className="font-display text-2xl font-extrabold text-navy">{v.model}</h2>
                  <p className="mt-0.5 text-xs text-slate-500">{v.version} · {v.voltage} · {v.power}</p>
                </div>
                <div className="text-right">
                  <p className="font-display text-2xl font-extrabold text-navy">{piezas}</p>
                  <p className="text-[10px] uppercase tracking-wider text-slate-500">{t("parts.pieces")}</p>
                </div>
              </div>
              {v.summary && <p className="border-b border-slate-100 p-4 text-sm leading-relaxed text-slate-600">{v.summary}</p>}
              <ul className="grid grid-cols-2 gap-px bg-slate-100 sm:grid-cols-3">
                {v.diagrams.map((dg) => (
                  <li key={dg.id}>
                    <Link href={`/despiece/${v.slug}/${dg.system.slug}`} className="flex h-full flex-col gap-1 bg-white p-3 transition hover:bg-slate-50">
                      <Icon name={dg.system.icon} size={16} className="text-[color:var(--color-action)]" />
                      <span className="text-xs font-bold leading-tight text-navy">{dg.system.name}</span>
                      <span className="font-mono text-[10px] text-slate-500">
                        {t("parts.piecesCount").replace("{n}", String(dg._count.pins))}
                      </span>
                    </Link>
                  </li>
                ))}
              </ul>
              <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-100 p-3">
                <VehiclePicker vehicle={{ slug: v.slug, brand: v.brand, model: v.model, version: v.version }} />
                <Link href={`/despiece/${v.slug}`} className="btn btn-primary btn-sm">
                  {t("parts.viewDiagram")} <Icon name="arrowRight" size={14} />
                </Link>
              </div>
            </article>
          );
        })}
      </div>
    </div>
  );
}
