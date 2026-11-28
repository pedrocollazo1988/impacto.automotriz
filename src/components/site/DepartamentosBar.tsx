import { getCategoriesCached } from "@/lib/catalog";
import CategoryMarquee from "./CategoryMarquee";

const normalizar = (valor: string) =>
  valor
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .trim()
    .toLowerCase()
    .replace(/\s+/g, " ");

// La base puede devolver filas repetidas con el mismo id o slug. Se deduplica
// aquí para que la barra nunca muestre dos veces la misma categoría, aunque la
// marquesina reciba una lista ya limpia. Dos categorías distintas que compartan
// nombre se conservan: su slug es lo que las hace accesibles.
function deduplicar<T extends { id: number; slug: string; name: string }>(categorias: T[]) {
  const vistos = new Set<string>();
  return categorias.filter((categoria) => {
    const slug = normalizar(categoria.slug ?? "");
    const nombre = normalizar(categoria.name ?? "");
    if (!slug && !nombre) return false;
    if (vistos.has(`id:${categoria.id}`) || (slug && vistos.has(`s:${slug}`))) return false;
    vistos.add(`id:${categoria.id}`);
    if (slug) vistos.add(`s:${slug}`);
    return true;
  });
}

// Franja de departamentos separada de la cabecera: la superficie ocupa todo el
// ancho de la pantalla y el contenido se alinea con el resto de la tienda.
export default async function DepartamentosBar() {
  const categorias = await getCategoriesCached().catch(() => []);
  const unicas = deduplicar(categorias);
  if (unicas.length === 0) return null;

  return (
    <div className="border-b border-slate-200 bg-white print:hidden">
      <div className="container-x">
        <CategoryMarquee categories={unicas.map((c) => ({ slug: c.slug, name: c.name, nameEn: c.nameEn }))} />
      </div>
    </div>
  );
}
