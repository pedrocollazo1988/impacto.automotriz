"use client";
import { useEffect, useState } from "react";
import { usePreferences } from "@/components/site/Preferences";
const KEY = "compare";
const read = (): number[] => { try { const v = JSON.parse(localStorage.getItem(KEY) ?? "[]"); return Array.isArray(v) ? v.filter(Number.isInteger).slice(0, 4) : []; } catch { return []; } };
export default function CompareToggle({ productId }: { productId: number }) {
  const { t } = usePreferences();
  const txt = (key: string, vars: Record<string, string | number>) =>
    Object.entries(vars).reduce((s, [k, v]) => s.replace(`{${k}}`, String(v)), t(key));
  const [on, setOn] = useState(false); const [n, setN] = useState(0);
  useEffect(() => { const l = read(); setOn(l.includes(productId)); setN(l.length); }, [productId]);
  const toggle = () => {
    let l = read();
    if (l.includes(productId)) l = l.filter((x) => x !== productId);
    else { if (l.length >= 4) return alert(t("cmpToggle.limit")); l = [...l, productId]; }
    localStorage.setItem(KEY, JSON.stringify(l)); setOn(l.includes(productId)); setN(l.length);
  };
  return <span className="inline-flex items-center gap-3"><button className="rounded-lg border px-4 py-2 text-sm" onClick={toggle}>{on ? t("cmpToggle.inCompare") : t("cmpToggle.compare")}</button>{n > 0 && <a href="/comparar" className="text-sm text-navy underline">{txt("cmpToggle.view", { n })}</a>}</span>;
}
