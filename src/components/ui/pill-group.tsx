"use client";

import { cn } from "@/lib/utils";

interface Option<T extends string> {
  value: T;
  label: string;
  hint?: string;
}

interface PillGroupProps<T extends string> {
  options: ReadonlyArray<Option<T>>;
  value: T | null;
  onChange: (value: T) => void;
  columns?: 2 | 3;
  "aria-label"?: string;
}

/** Radio group in stile segmented control. */
export function PillGroup<T extends string>({
  options,
  value,
  onChange,
  columns = 3,
  ...aria
}: PillGroupProps<T>) {
  return (
    <div
      role="radiogroup"
      aria-label={aria["aria-label"]}
      className={cn("grid gap-2", columns === 2 ? "grid-cols-2" : "grid-cols-3")}
    >
      {options.map((opt) => {
        const selected = value === opt.value;
        return (
          <button
            key={opt.value}
            type="button"
            role="radio"
            aria-checked={selected}
            onClick={() => onChange(opt.value)}
            className={cn(
              "rounded-2xl border px-3 py-3 text-sm font-medium transition-all duration-200",
              selected
                ? "border-transparent bg-primary text-primary-foreground shadow-soft"
                : "bg-card hover:bg-muted",
            )}
          >
            <span className="block">{opt.label}</span>
            {opt.hint && (
              <span
                className={cn(
                  "mt-0.5 block text-xs font-normal",
                  selected ? "text-primary-foreground/80" : "text-muted-foreground",
                )}
              >
                {opt.hint}
              </span>
            )}
          </button>
        );
      })}
    </div>
  );
}
