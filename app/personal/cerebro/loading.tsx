export default function Loading() {
  return (
    <div className="animate-pulse px-8 py-8">
      {/* Barra de días */}
      <div className="mb-6 flex gap-2">
        {[1, 2, 3, 4, 5, 6, 7].map((i) => (
          <div key={i} className="h-14 flex-1 rounded-xl bg-neutral-800" />
        ))}
      </div>
      {/* Bloques de tareas */}
      <div className="grid grid-cols-2 gap-6">
        <div className="flex flex-col gap-2">
          <div className="mb-2 h-3 w-28 rounded bg-neutral-800" />
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-neutral-800/70" />
          ))}
        </div>
        <div className="flex flex-col gap-2">
          <div className="mb-2 h-3 w-28 rounded bg-neutral-800" />
          {[1, 2, 3].map((i) => (
            <div key={i} className="h-10 rounded-lg bg-neutral-800/70" />
          ))}
        </div>
      </div>
    </div>
  );
}
