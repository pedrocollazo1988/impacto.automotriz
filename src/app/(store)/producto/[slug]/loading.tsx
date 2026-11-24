export default function CargandoProducto() {
  return (
    <div className="container-x py-8" aria-busy="true" aria-label="Cargando producto">
      <div className="mb-4 h-4 w-64 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-8 lg:grid-cols-2">
        <div className="aspect-square animate-pulse rounded-2xl bg-slate-200" />
        <div className="space-y-4">
          <div className="h-4 w-28 animate-pulse rounded bg-slate-200" />
          <div className="h-9 w-4/5 animate-pulse rounded bg-slate-200" />
          <div className="h-5 w-40 animate-pulse rounded bg-slate-200" />
          <div className="h-32 animate-pulse rounded-2xl bg-slate-200" />
          <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
          <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
        </div>
      </div>
    </div>
  );
}
