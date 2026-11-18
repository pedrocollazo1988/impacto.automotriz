import Link from "next/link";
import Logo from "@/components/brand/Logo";
import Icon from "@/components/brand/Icon";

export const metadata = { title: "Página no encontrada" };

export default function NotFound() {
  return (
    <div className="container-x grid min-h-[70vh] place-items-center py-16 text-center">
      <div className="max-w-md">
        <Logo size="md" className="mx-auto" />
        <p className="mt-8 font-display text-7xl font-extrabold text-navy">404</p>
        <h1 className="mt-2 font-display text-2xl font-bold text-navy">No encontramos esta página</h1>
        <p className="mt-3 text-slate-500">Puede que el enlace esté mal escrito o que la pieza ya no esté disponible. Prueba a buscar por vehículo o vuelve al catálogo.</p>
        <div className="mt-7 flex flex-wrap justify-center gap-3">
          <Link href="/" className="btn btn-primary">Volver al inicio</Link>
          <Link href="/catalogo" className="btn btn-ghost"><Icon name="search" size={16} /> Ver catálogo</Link>
        </div>
      </div>
    </div>
  );
}
