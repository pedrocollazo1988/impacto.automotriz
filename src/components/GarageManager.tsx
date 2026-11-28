"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Icon from "@/components/brand/Icon";
import Turnstile from "@/components/Turnstile";
import { usePreferences } from "@/components/site/Preferences";

type V = { id: number; make: string; model: string; year: number; alias: string | null };
export default function GarageManager({ vehicles }: { vehicles: V[] }) {
  const { t } = usePreferences();
  const router = useRouter(); const [f, setF] = useState({ make: "", model: "", year: "" }); const [err, setErr] = useState("");
  const [captcha, setCaptcha] = useState(""); const [captchaKey, setCaptchaKey] = useState(0);
  const add = async () => {
    setErr("");
    if (f.make.trim().length < 2) return setErr(t("garage.errMake"));
    if (f.model.trim().length < 1) return setErr(t("garage.errModel"));
    const year = Number(f.year);
    if (!Number.isInteger(year) || year < 1900 || year > 2100) return setErr(t("garage.errYear"));
    if (process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && !captcha) return setErr(t("garage.errCaptcha"));
    const r = await fetch("/api/account/garage", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ make: f.make, model: f.model, year, turnstileToken: captcha }) });
    if (!r.ok) { setCaptcha(""); setCaptchaKey((k) => k + 1); return setErr((await r.json()).error ?? t("garage.errDatos")); } setF({ make: "", model: "", year: "" }); setCaptcha(""); setCaptchaKey((k) => k + 1); setErr(""); router.refresh();
  };
  return (
    <div className="space-y-4">
      {vehicles.length ? (
        <ul className="grid gap-3 sm:grid-cols-2">
          {vehicles.map((v) => (
            <li key={v.id} className="card flex items-center gap-3 p-4">
              <span className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-[color:var(--color-navy)]/8 text-[color:var(--color-action-deep)]"><Icon name="car" size={20} /></span>
              <div className="min-w-0 flex-1"><p className="font-semibold text-slate-800">{v.make} {v.model}</p><p className="text-xs text-slate-400">{v.year}</p></div>
              <Link href={`/catalogo?make=${encodeURIComponent(v.make)}&model=${encodeURIComponent(v.model)}&year=${v.year}`} className="btn btn-ghost h-9 px-3 text-xs">{t("garage.parts")}</Link>
              <button aria-label={t("garage.remove")} className="grid h-9 w-9 place-items-center rounded-lg text-slate-400 transition hover:bg-red-50 hover:text-red-600" onClick={async () => { await fetch(`/api/account/garage?id=${v.id}`, { method: "DELETE" }); router.refresh(); }}><Icon name="trash" size={16} /></button>
            </li>
          ))}
        </ul>
      ) : <p className="text-sm text-slate-500">{t("garage.empty")}</p>}
      <div className="flex flex-wrap gap-2">
        <input className="input flex-1 min-w-32" placeholder={t("garage.make")} aria-label={t("garage.make")} value={f.make} onChange={(e) => setF({ ...f, make: e.target.value })} />
        <input className="input flex-1 min-w-32" placeholder={t("garage.model")} aria-label={t("garage.model")} value={f.model} onChange={(e) => setF({ ...f, model: e.target.value })} />
        <input className="input w-28" type="number" placeholder={t("garage.year")} aria-label={t("garage.year")} value={f.year} onChange={(e) => setF({ ...f, year: e.target.value })} />
        <button className="btn btn-primary" onClick={add}><Icon name="plus" size={16} /> {t("garage.add")}</button>
      </div>
      <Turnstile key={captchaKey} onToken={setCaptcha} />
      {err && <p className="text-sm text-red-600">{err}</p>}
    </div>);
}
