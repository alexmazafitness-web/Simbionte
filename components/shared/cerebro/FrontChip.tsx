import { FRONT_COLOR, FRONT_LABEL, type Front } from "@/lib/personal/constants";

export function FrontChip({ front }: { front: Front }) {
  const color = FRONT_COLOR[front];
  return (
    <span
      className="inline-flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10.5px] font-semibold"
      style={{ backgroundColor: `${color}26`, color }}
    >
      {FRONT_LABEL[front]}
    </span>
  );
}
