"use client";
import { usePathname } from "next/navigation";
import type { ReactNode } from "react";

// La portada pinta sus propias barras después del carrusel para que el banner
// quede pegado a la cabecera; el resto de páginas las recibe aquí.
export default function StoreChrome({ bars, children }: { bars: ReactNode; children: ReactNode }) {
  const path = usePathname();
  return (
    <>
      {path === "/" ? null : bars}
      {children}
    </>
  );
}
