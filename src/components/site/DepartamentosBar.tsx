import { getCategoriesCached } from "@/lib/catalog";
import CategoryMarquee from "./CategoryMarquee";

// Franja de departamentos separada de la cabecera: acceso fijo a todo el
// catálogo y marquesina de categorías, centrada en el ancho de la tienda.
export default async function DepartamentosBar() {
  const categorias = await getCategoriesCached().catch(() => []);
  if (categorias.length === 0) return null;

  return (
    <div className="container-x mt-3 mb-1 print:hidden">
      <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white shadow-[0_8px_24px_-18px_rgba(2,27,72,0.45)]">
        <CategoryMarquee categories={categorias.map((c) => ({ slug: c.slug, name: c.name }))} />
      </div>
    </div>
  );
}
