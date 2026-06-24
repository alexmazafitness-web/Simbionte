export function SearchInput({
  value,
  onChange,
  placeholder,
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder: string;
}) {
  return (
    <div className="relative max-w-[300px] flex-1">
      <svg
        viewBox="0 0 24 24"
        className="pointer-events-none absolute top-1/2 left-3.5 h-[15px] w-[15px] -translate-y-1/2 stroke-text-dim"
        fill="none"
        strokeWidth={1.8}
      >
        <circle cx="11" cy="11" r="7" />
        <path d="M21 21l-4-4" />
      </svg>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        className="w-full rounded-lg border border-line bg-panel-2 py-2.5 pr-3.5 pl-9 text-sm outline-none focus:border-gold-dim"
      />
    </div>
  );
}
