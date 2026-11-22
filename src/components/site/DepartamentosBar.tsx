import Link from "next/link";
import { getCategoriesCached } from "@/lib/catalog";
import Icon from "@/components/brand/Icon";

// Franja de departamentos, como la de MCV: siempre visible bajo la cabecera
// para entrar a una categoría en un clic desde cualquier página.
export default async function DepartamentosBar() {
  const categorias = await getCategoriesCached().catch(() => []);
  if (categorias.length === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-white">
      <div className="container-x flex items-center gap-1 overflow-x-auto py-1 [scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
        <Link
          href="/catalogo"
          className="flex min-h-12 shrink-0 items-center gap-1.5 rounded-lg px-2.5 text-[13px] font-bold text-navy transition hover:bg-slate-100 lg:min-h-0 lg:py-1.5"
        >
          <Icon name="grid" size={15} /> Todos los productos
        </Link>
        <span aria-hidden className="mx-1 h-4 w-px shrink-0 bg-slate-200" />
        {categorias.map((c) => (
          <Link
            key={c.id}
            href={`/catalogo?categoria=${c.slug}`}
            className="flex min-h-12 shrink-0 items-center whitespace-nowrap rounded-lg px-2.5 text-[13px] font-semibold text-slate-600 transition hover:bg-slate-100 hover:text-navy lg:min-h-0 lg:py-1.5"
          >
            {c.name}
          </Link>
        ))}
      </div>
    </div>
  );
}
