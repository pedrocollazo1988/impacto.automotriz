"use client";
import { useEffect, useState } from "react";
import Script from "next/script";

// Google Analytics 4 solo se carga si NEXT_PUBLIC_GA_ID está definido Y la persona acepta las cookies de analítica.
export default function Analytics() {
  const id = process.env.NEXT_PUBLIC_GA_ID; const [c, setC] = useState<"yes" | "no" | null>(null); const [ready, setReady] = useState(false);
  useEffect(() => { const v = localStorage.getItem("cookie-consent"); setC(v === "yes" || v === "no" ? v : null); setReady(true); }, []);
  if (!id || !ready) return null;
  const choose = (v: "yes" | "no") => { localStorage.setItem("cookie-consent", v); setC(v); };
  return (<>
    {c === null && <div className="fixed inset-x-0 bottom-0 z-30 flex flex-wrap items-center justify-between gap-3 bg-slate-900 p-4 text-sm text-white">
      <span>Usamos cookies de analítica para mejorar la tienda. ¿Las aceptas?</span>
      <span className="space-x-2"><button className="rounded border border-white/40 px-3 py-1" onClick={() => choose("no")}>Rechazar</button><button className="rounded bg-white px-3 py-1 text-slate-900" onClick={() => choose("yes")}>Aceptar</button></span></div>}
    {c === "yes" && <><Script src={`https://www.googletagmanager.com/gtag/js?id=${id}`} strategy="afterInteractive" />
      <Script id="ga4" strategy="afterInteractive">{`window.dataLayer=window.dataLayer||[];function gtag(){dataLayer.push(arguments)}gtag('js',new Date());gtag('config','${id}');`}</Script></>}
  </>);
}
