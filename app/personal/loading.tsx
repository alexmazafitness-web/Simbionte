export default function Loading() {
  return (
    <div className="animate-pulse px-10 py-10">
      <div className="mb-6 h-3 w-36 rounded bg-neutral-800" />
      <div className="flex flex-col gap-2">
        {[1, 2, 3, 4, 5].map((i) => (
          <div key={i} className="h-12 rounded-xl bg-neutral-800/70" style={{ opacity: 1 - i * 0.1 }} />
        ))}
      </div>
    </div>
  );
}
