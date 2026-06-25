const COLOR_CLASS: Record<string, string> = {
  gold: "text-gold",
  green: "text-ok",
  red: "text-bad",
  amber: "text-warn",
  text2: "text-text-2",
};

export function MetricCard({ label, value, color = "text2", sub }: { label: string; value: string; color?: string; sub?: string }) {
  return (
    <div className="rounded-xl border border-line-soft bg-panel-2 p-4">
      <div className="mb-1.5 text-[10px] font-semibold tracking-wide text-text-dim uppercase">{label}</div>
      <div className={`text-2xl font-bold tracking-tight ${COLOR_CLASS[color] ?? "text-foreground"}`}>{value}</div>
      {sub && <div className="mt-1 text-[10px] text-text-dim">{sub}</div>}
    </div>
  );
}
