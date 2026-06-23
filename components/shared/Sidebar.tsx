const GROUPS = ["Inicio", "Captación", "Personal", "Coaching", "Ajustes"] as const;

export function Sidebar() {
  return (
    <aside className="flex h-full w-56 flex-col border-r border-white/10 bg-[#141414] px-4 py-6">
      <span className="mb-8 px-2 font-heading text-lg font-semibold tracking-wide text-[#C9A96E]">
        Simbionte
      </span>
      <nav className="flex flex-col gap-1">
        {GROUPS.map((group) => (
          <span
            key={group}
            className="rounded px-2 py-2 text-sm text-neutral-400"
          >
            {group}
          </span>
        ))}
      </nav>
    </aside>
  );
}
