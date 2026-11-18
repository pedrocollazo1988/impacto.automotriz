"use client";

import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";

export default function Error({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <Logo size="md" className="mx-auto" />
        <span className="mt-8 inline-grid h-16 w-16 place-items-center rounded-2xl bg-red-50 text-red-500"><Icon name="refresh" size={30} /></span>
        <h1 className="mt-4 font-display text-2xl font-bold text-navy">Algo no salió bien</h1>
        <p className="mt-3 text-slate-500">Tuvimos un problema al cargar esta página. Vuelve a intentarlo; si sigue fallando, escríbenos por WhatsApp.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <button onClick={reset} className="btn btn-primary"><Icon name="refresh" size={16} /> Reintentar</button>
          <Link href="/" className="btn btn-ghost">Ir al inicio</Link>
        </div>
      </div>
    </div>
  );
}
