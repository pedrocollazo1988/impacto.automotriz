export default function CargandoCatalogo() {
  return (
    <div className="container-x py-8" aria-busy="true" aria-label="Cargando catálogo">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-2xl bg-slate-200 lg:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => <div key={i} className="aspect-[4/5] animate-pulse rounded-2xl bg-slate-200" />)}
        </div>
      </div>
    </div>
  );
}
