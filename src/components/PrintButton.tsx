"use client";
export default function PrintButton() { return <button onClick={() => window.print()} className="rounded bg-navy px-4 py-2 text-sm text-white print:hidden">Imprimir / guardar PDF</button>; }
