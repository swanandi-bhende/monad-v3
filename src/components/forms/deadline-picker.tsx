"use client";

import { inputClass } from "@/components/ui/field";

const PRESETS = [
  { label: "10 min", minutes: 10 },
  { label: "1 hour", minutes: 60 },
  { label: "1 day", minutes: 24 * 60 },
  { label: "3 days", minutes: 3 * 24 * 60 },
];

function pad(value: number) {
  return String(value).padStart(2, "0");
}

function toLocalParts(date: Date) {
  return {
    date: `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())}`,
    time: `${pad(date.getHours())}:${pad(date.getMinutes())}`,
  };
}

export function DeadlinePicker({
  date,
  time,
  disabled,
  onChange,
}: {
  date: string;
  time: string;
  disabled: boolean;
  onChange: (next: { date: string; time: string }) => void;
}) {
  return (
    <div className="space-y-3">
      <div className="grid grid-cols-2 gap-3">
        <input
          id="deadline-date"
          aria-label="Deadline date"
          type="date"
          className={inputClass}
          value={date}
          onChange={(e) => onChange({ date: e.target.value, time })}
          disabled={disabled}
        />
        <input
          id="deadline-time"
          aria-label="Deadline time"
          type="time"
          className={inputClass}
          value={time}
          onChange={(e) => onChange({ date, time: e.target.value })}
          disabled={disabled}
        />
      </div>
      <div className="flex flex-wrap gap-2">
        {PRESETS.map((preset) => (
          <button
            key={preset.label}
            type="button"
            disabled={disabled}
            onClick={() => onChange(toLocalParts(new Date(Date.now() + preset.minutes * 60_000)))}
            className="text-caption border-line text-muted hover:text-ink rounded-full border px-3 py-1 transition-colors disabled:opacity-50"
          >
            + {preset.label}
          </button>
        ))}
      </div>
    </div>
  );
}
