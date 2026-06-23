export default function Home() {
  const today = new Date().toLocaleDateString("es-ES", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  return (
    <div className="flex flex-col gap-2 px-10 py-10">
      <span className="text-sm capitalize text-neutral-500">{today}</span>
      <h1 className="font-display text-6xl tracking-wide text-[#C9A96E]">Hoy</h1>
      <p className="mt-4 max-w-md text-sm text-neutral-400">
        Aquí vivirá el resumen del día: tareas, recordatorios y eventos. Todavía no hay nada
        conectado.
      </p>
    </div>
  );
}
