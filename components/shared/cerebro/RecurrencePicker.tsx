"use client";

import { useState } from "react";
import { DAYS_SH } from "@/lib/personal/constants";
import { todayISO } from "@/lib/personal/format";
import type { EndType, RecurRule } from "@/lib/personal/recurrence";

const inputClass = "w-full rounded-lg border border-line bg-panel-2 px-3 py-2 text-[13px] outline-none focus:border-gold-dim";

export function RecurrencePicker({ value, onChange }: { value: RecurRule | null; onChange: (r: RecurRule | null) => void }) {
  const [days, setDays] = useState<number[]>(value?.days ?? []);
  const [endType, setEndType] = useState<EndType>(value?.endType ?? "never");
  const [until, setUntil] = useState(value?.until ?? "");
  const [count, setCount] = useState(value?.count ?? 10);
  // Se conserva el inicio original al editar (igual que el HTML:
  // `trStart=t.recur.start||todayISO()`) — solo es "hoy" si la regla es nueva.
  const start = value?.start ?? todayISO();

  function emit(nextDays: number[], nextEndType: EndType, nextUntil: string, nextCount: number) {
    if (nextDays.length === 0) {
      onChange(null);
      return;
    }
    onChange({
      days: nextDays,
      start,
      endType: nextEndType,
      until: nextEndType === "until" ? nextUntil : null,
      count: nextEndType === "count" ? nextCount : null,
    });
  }

  function toggleDay(d: number) {
    const next = days.includes(d) ? days.filter((x) => x !== d) : [...days, d];
    setDays(next);
    emit(next, endType, until, count);
  }

  return (
    <div>
      <div className="mb-2.5 flex gap-1.5">
        {[1, 2, 3, 4, 5, 6, 0].map((d) => (
          <button
            key={d}
            type="button"
            onClick={() => toggleDay(d)}
            className={`flex-1 rounded-lg py-2 text-[13px] transition ${
              days.includes(d) ? "bg-gold font-semibold text-[#1a1208]" : "border border-line text-text-2 hover:border-gold-dim"
            }`}
          >
            {DAYS_SH[d][0]}
          </button>
        ))}
      </div>
      {days.length > 0 && (
        <div className="grid grid-cols-3 gap-2">
          <select
            className={inputClass}
            value={endType}
            onChange={(e) => {
              const v = e.target.value as EndType;
              setEndType(v);
              emit(days, v, until, count);
            }}
          >
            <option value="never">Sin fin</option>
            <option value="until">Hasta fecha</option>
            <option value="count">Nº de veces</option>
          </select>
          {endType === "until" && (
            <input
              type="date"
              className={inputClass}
              value={until}
              onChange={(e) => {
                setUntil(e.target.value);
                emit(days, endType, e.target.value, count);
              }}
            />
          )}
          {endType === "count" && (
            <input
              type="number"
              min={1}
              className={inputClass}
              value={count}
              onChange={(e) => {
                const v = Number(e.target.value) || 1;
                setCount(v);
                emit(days, endType, until, v);
              }}
            />
          )}
        </div>
      )}
    </div>
  );
}
