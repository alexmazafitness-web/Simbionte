export default function Loading() {
  return (
    <div className="animate-pulse px-10 py-10">
      <div className="mb-6 h-3 w-28 rounded bg-neutral-800" />
      {/* KPI cards */}
      <div className="mb-8 grid grid-cols-3 gap-4">
        {[1, 2, 3].map((i) => (
          <div key={i} className="h-24 rounded-xl bg-neutral-800/70" />
        ))}
      </div>
      {/* Tabla de transacciones */}
      <div className="mb-3 h-3 w-32 rounded bg-neutral-800" />
      <div className="flex flex-col gap-1.5">
        {[1, 2, 3, 4, 5, 6].map((i) => (
          <div key={i} className="h-10 rounded-lg bg-neutral-800/70" style={{ opacity: 1 - i * 0.08 }} />
        ))}
      </div>
    </div>
  );
}
