export function Chip({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`rounded-full border px-3.5 py-1.5 text-xs font-medium transition ${
        active
          ? "border-gold bg-gold font-semibold text-[#1a1208]"
          : "border-line text-text-2 hover:border-gold-dim hover:text-foreground"
      }`}
    >
      {children}
    </button>
  );
}
