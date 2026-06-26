export default function Loading() {
  return (
    <div className="animate-pulse px-10 py-10">
      <div className="mb-1 h-3 w-28 rounded bg-neutral-800" />
      <div className="mb-8 h-14 w-20 rounded-lg bg-neutral-800" />

      {/* Acciones */}
      <div className="mb-10">
        <div className="mb-3.5 h-3 w-40 rounded bg-neutral-800" />
        <div className="flex flex-col gap-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-11 rounded-lg bg-neutral-800/70" />
          ))}
        </div>
      </div>

      {/* Tareas + Recordatorios */}
      <div className="mb-10 grid grid-cols-2 gap-8">
        {[0, 1].map((col) => (
          <div key={col}>
            <div className="mb-3.5 h-3 w-32 rounded bg-neutral-800" />
            <div className="flex flex-col gap-2">
              {[1, 2].map((i) => (
                <div key={i} className="h-11 rounded-lg bg-neutral-800/70" />
              ))}
            </div>
          </div>
        ))}
      </div>

      {/* Finanzas */}
      <div>
        <div className="mb-3.5 h-3 w-24 rounded bg-neutral-800" />
        <div className="h-20 rounded-xl bg-neutral-800/70" />
      </div>
    </div>
  );
}
