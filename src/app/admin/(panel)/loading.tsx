export default function Loading() {
  return (
    <div className="space-y-4" aria-busy="true" aria-live="polite">
      <div className="h-8 w-56 animate-pulse rounded-lg bg-slate-200/70" />
      <div className="adm-panel divide-y divide-slate-100">
        {Array.from({ length: 6 }).map((_, i) => (
          <div key={i} className="flex items-center gap-4 px-4 py-4">
            <div className="h-4 flex-1 animate-pulse rounded bg-slate-200/70" />
            <div className="h-4 w-24 animate-pulse rounded bg-slate-200/70" />
            <div className="h-4 w-16 animate-pulse rounded bg-slate-200/70" />
          </div>
        ))}
      </div>
    </div>
  );
}
