type Variant = "ok" | "warn" | "bad" | "neutral";

const VARIANT_CLASSES: Record<Variant, string> = {
  ok: "bg-ok-bg text-ok",
  warn: "bg-warn-bg text-warn",
  bad: "bg-bad-bg text-bad",
  neutral: "bg-panel-3 text-text-dim",
};

const DOT_CLASSES: Record<Variant, string> = {
  ok: "bg-ok",
  warn: "bg-warn",
  bad: "bg-bad",
  neutral: "bg-text-dim",
};

export function Pill({
  variant,
  children,
  dot = true,
}: {
  variant: Variant;
  children: React.ReactNode;
  dot?: boolean;
}) {
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-0.5 text-[11px] font-semibold ${VARIANT_CLASSES[variant]}`}
    >
      {dot && <span className={`h-1.5 w-1.5 rounded-full ${DOT_CLASSES[variant]}`} />}
      {children}
    </span>
  );
}
