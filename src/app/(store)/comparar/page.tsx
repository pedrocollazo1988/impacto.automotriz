"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import { usePreferences } from "@/components/site/Preferences";

type P = { id: number; slug: string; name: string; priceUsd: number; inStock: boolean; brand: string | null; category: string; specs: Record<string, string>; fits: string[] };

export default function Comparar() {
  const { t } = usePreferences();
  const [ps, setPs] = useState<P[] | null>(null);
  useEffect(() => {
    let ids: number[] = []; try { ids = JSON.parse(localStorage.getItem("compare") ?? "[]"); } catch {}
    if (!ids.length) return setPs([]);
    fetch("/api/compare", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }) }).then((r) => r.json()).then((d) => setPs(Array.isArray(d) ? d : []));
  }, []);
  const remove = (id: number) => { const l = (JSON.parse(localStorage.getItem("compare") ?? "[]") as number[]).filter((x) => x !== id); localStorage.setItem("compare", JSON.stringify(l)); setPs((p) => p?.filter((x) => x.id !== id) ?? []); };

  if (ps === null) return <div className="container-x py-16"><p className="text-sm text-slate-400">{t("cmp.loading")}</p></div>;
  if (!ps.length) return (
    <div className="container-x py-16">
      <div className="card mx-auto grid max-w-md place-items-center p-10 text-center">
        <span className="grid h-16 w-16 place-items-center rounded-2xl bg-slate-100 text-slate-400"><Icon name="compare" size={30} /></span>
        <h1 className="mt-4 font-display text-xl font-bold text-navy">{t("cmp.emptyTitle")}</h1>
        <p className="mt-1 text-sm text-slate-500">{t("cmp.emptyHint")}</p>
        <Link href="/catalogo" className="btn btn-primary mt-5">{t("cmp.viewCatalog")}</Link>
      </div>
    </div>
  );
  const keys = [...new Set(ps.flatMap((p) => Object.keys(p.specs)))];
  const row = (label: string, f: (p: P) => React.ReactNode, first = false) => (
    <tr className={first ? "" : "border-t border-slate-100"}>
      <th className="w-40 py-3 pr-4 text-left align-top text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</th>
      {ps.map((p) => <td key={p.id} className="py-3 pr-4 align-top text-sm text-slate-700">{f(p)}</td>)}
    </tr>
  );
  return (
    <div className="container-x py-8">
      <div className="mb-6 flex items-end justify-between gap-4">
        <div><span className="eyebrow">{t("footer.compare")}</span><h1 className="mt-1 font-display text-3xl font-extrabold text-navy">{t("cmp.title")}</h1></div>
        <Link href="/catalogo" className="btn btn-ghost hidden sm:inline-flex">{t("cmp.keepShopping")}</Link>
      </div>
      <div className="card overflow-x-auto p-4">
        <table className="w-full min-w-[640px]"><tbody>
          {row(t("cmp.product"), (p) => (
            <div className="flex flex-col gap-1.5">
              <Link className="font-semibold text-navy link-underline" href={`/producto/${p.slug}`}>{p.name}</Link>
              <button className="flex w-fit items-center gap-1 text-xs text-red-600 hover:underline" onClick={() => remove(p.id)}><Icon name="trash" size={12} /> {t("cmp.remove")}</button>
            </div>
          ), true)}
          {row(t("cmp.price"), (p) => <span className="font-display text-lg font-extrabold text-navy">{p.priceUsd.toFixed(2)} USD</span>)}
          {row(t("cmp.brand"), (p) => p.brand ?? "—")}
          {row(t("cmp.category"), (p) => <span className="badge bg-slate-100 text-slate-600">{p.category}</span>)}
          {row(t("cmp.availability"), (p) => p.inStock
            ? <span className="flex items-center gap-1.5 text-emerald-700"><Icon name="check" size={14} /> {t("cmp.inStock")}</span>
            : <span className="text-red-600">{t("cmp.outOfStock")}</span>)}
          {keys.map((k) => row(k, (p) => p.specs[k] ?? "—"))}
          {row(t("cmp.fits"), (p) => p.fits.length ? <div className="flex flex-col gap-1">{p.fits.map((f) => <span key={f} className="chip w-fit">{f}</span>)}</div> : "—")}
        </tbody></table>
      </div>
    </div>
  );
}
