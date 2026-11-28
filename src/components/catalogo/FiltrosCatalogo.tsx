"use client";

import { useEffect, useRef, type ReactNode } from "react";

/**
 * Panel de filtros del catálogo.
 *
 * Llega plegado del servidor porque en móvil debe seguir así: desplegado
 * empujaría la parrilla más de 900 px hacia abajo. En escritorio se abre solo,
 * en cuanto se hidrata, porque ahí va en una columna al lado de los productos.
 *
 * Abrirlo no cuenta como desplazamiento de diseño: la columna de productos es
 * más alta y el `aside` es `self-start`, así que nada de lo que se ve se mueve.
 */
export default function FiltrosCatalogo({
  abierto,
  resumen,
  children,
}: {
  abierto: boolean;
  resumen: ReactNode;
  children: ReactNode;
}) {
  const ref = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    const detalles = ref.current;
    if (!detalles || abierto || detalles.open) return;
    if (window.matchMedia("(min-width: 1024px)").matches) detalles.open = true;
  }, [abierto]);

  return (
    <details ref={ref} open={abierto} className="card p-4">
      <summary className="mb-3 flex cursor-pointer items-center gap-2 font-display text-sm font-bold text-navy">
        {resumen}
      </summary>
      {children}
    </details>
  );
}
