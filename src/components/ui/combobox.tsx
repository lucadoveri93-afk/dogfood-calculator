"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Check, ChevronsUpDown, Search } from "lucide-react";
import { cn } from "@/lib/utils";

export interface ComboOption {
  value: string;
  label: string;
  hint?: string;
}

interface ComboboxProps {
  options: ComboOption[];
  value: string | null;
  onChange: (value: string) => void;
  /** Filtro fuzzy esterno (Fuse.js); riceve la query e restituisce i value ordinati. */
  filter: (query: string) => string[];
  placeholder: string;
  emptyMessage?: string;
  disabled?: boolean;
}

/**
 * Autocomplete con ricerca istantanea. La lista è filtrata dal chiamante
 * (ricerca fuzzy centralizzata in lib/search.ts), qui solo presentazione.
 */
export function Combobox({
  options,
  value,
  onChange,
  filter,
  placeholder,
  emptyMessage = "Nessun risultato",
  disabled,
}: ComboboxProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const rootRef = useRef<HTMLDivElement>(null);

  const selected = options.find((o) => o.value === value) ?? null;

  const visible = useMemo(() => {
    const ordered = filter(query);
    const byValue = new Map(options.map((o) => [o.value, o]));
    return ordered
      .map((v) => byValue.get(v))
      .filter((o): o is ComboOption => o !== undefined);
  }, [filter, query, options]);

  useEffect(() => {
    const onClickOutside = (e: MouseEvent) => {
      if (rootRef.current && !rootRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClickOutside);
    return () => document.removeEventListener("mousedown", onClickOutside);
  }, []);

  return (
    <div ref={rootRef} className="relative">
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen((o) => !o)}
        className={cn(
          "flex h-12 w-full items-center justify-between rounded-2xl border bg-card px-4 text-left text-sm shadow-soft transition-colors",
          disabled && "pointer-events-none opacity-50",
          !selected && "text-muted-foreground",
        )}
        aria-expanded={open}
      >
        <span className="truncate">{selected ? selected.label : placeholder}</span>
        <ChevronsUpDown className="ml-2 h-4 w-4 shrink-0 text-muted-foreground" />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ opacity: 0, y: -6, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -6, scale: 0.98 }}
            transition={{ duration: 0.15, ease: "easeOut" }}
            className="absolute z-30 mt-2 w-full overflow-hidden rounded-2xl border bg-card shadow-soft-lg"
          >
            <div className="flex items-center gap-2 border-b px-4 py-3">
              <Search className="h-4 w-4 text-muted-foreground" />
              <input
                autoFocus
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Cerca…"
                className="w-full bg-transparent text-sm outline-none placeholder:text-muted-foreground"
              />
            </div>
            <ul className="max-h-64 overflow-y-auto p-1" role="listbox">
              {visible.length === 0 && (
                <li className="px-4 py-3 text-sm text-muted-foreground">
                  {emptyMessage}
                </li>
              )}
              {visible.map((opt) => (
                <li key={opt.value}>
                  <button
                    type="button"
                    role="option"
                    aria-selected={opt.value === value}
                    onClick={() => {
                      onChange(opt.value);
                      setOpen(false);
                      setQuery("");
                    }}
                    className={cn(
                      "flex w-full items-center justify-between rounded-xl px-3 py-2.5 text-left text-sm transition-colors hover:bg-muted",
                      opt.value === value && "font-medium",
                    )}
                  >
                    <span>
                      {opt.label}
                      {opt.hint && (
                        <span className="ml-2 text-xs text-muted-foreground">
                          {opt.hint}
                        </span>
                      )}
                    </span>
                    {opt.value === value && <Check className="h-4 w-4 text-primary" />}
                  </button>
                </li>
              ))}
            </ul>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
