// El esqueleto reserva el alto real de la página: `min-h-svh` deja el pie fuera
// del pliegue y las tarjetas copian la proporción de la tarjeta de verdad
// (imagen 4/3 + texto), así el contenido no empuja nada cuando llega.
export default function CargandoCatalogo() {
  return (
    <div className="container-x min-h-svh py-8" aria-busy="true" aria-label="Cargando catálogo">
      <div className="mb-6 h-8 w-56 animate-pulse rounded bg-slate-200" />
      <div className="grid gap-6 lg:grid-cols-[250px_1fr]">
        <div className="hidden h-96 animate-pulse rounded-2xl bg-slate-200 lg:block" />
        <div className="grid grid-cols-2 gap-4 md:grid-cols-3 xl:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="card overflow-hidden">
              <div className="aspect-[4/3] animate-pulse bg-slate-200" />
              <div className="space-y-2 p-3.5">
                <div className="h-2.5 w-16 animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-full animate-pulse rounded bg-slate-200" />
                <div className="h-4 w-2/3 animate-pulse rounded bg-slate-200" />
                <div className="h-5 w-24 animate-pulse rounded bg-slate-200" />
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
