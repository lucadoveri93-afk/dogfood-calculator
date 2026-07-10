"use client";

import { useEffect, useState } from "react";
import { Clock, Star, Trash2 } from "lucide-react";
import {
  clearHistory,
  loadFavorites,
  loadHistory,
  type HistoryEntry,
} from "@/lib/storage";
import { cn } from "@/lib/utils";

interface HistoryStripProps {
  onSelect: (entry: HistoryEntry) => void;
}

/** Cronologia e preferiti come chip cliccabili sopra il form. */
export function HistoryStrip({ onSelect }: HistoryStripProps) {
  const [tab, setTab] = useState<"history" | "favorites">("history");
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [favorites, setFavorites] = useState<HistoryEntry[]>([]);

  useEffect(() => {
    setHistory(loadHistory());
    setFavorites(loadFavorites());
  }, []);

  const list = tab === "history" ? history : favorites;
  if (history.length === 0 && favorites.length === 0) return null;

  return (
    <div className="mb-5">
      <div className="mb-2 flex items-center gap-3 text-sm">
        <TabButton
          active={tab === "history"}
          onClick={() => setTab("history")}
          icon={<Clock className="h-3.5 w-3.5" />}
          label={`Cronologia (${history.length})`}
        />
        <TabButton
          active={tab === "favorites"}
          onClick={() => setTab("favorites")}
          icon={<Star className="h-3.5 w-3.5" />}
          label={`Preferiti (${favorites.length})`}
        />
        {tab === "history" && history.length > 0 && (
          <button
            type="button"
            onClick={() => {
              clearHistory();
              setHistory([]);
            }}
            className="ml-auto inline-flex items-center gap-1 text-xs text-muted-foreground hover:text-foreground"
          >
            <Trash2 className="h-3 w-3" /> Svuota
          </button>
        )}
      </div>
      <div className="flex gap-2 overflow-x-auto pb-1">
        {list.length === 0 && (
          <p className="text-xs text-muted-foreground">
            {tab === "favorites"
              ? "Nessun preferito: salva un risultato con la stella."
              : "Nessuna ricerca recente."}
          </p>
        )}
        {list.map((entry) => (
          <button
            key={`${entry.input.productId}-${entry.timestamp}`}
            type="button"
            onClick={() => onSelect(entry)}
            className="shrink-0 rounded-full border bg-card px-3.5 py-1.5 text-xs shadow-soft transition-colors hover:bg-muted"
          >
            <span className="font-medium">{entry.productName}</span>
            <span className="text-muted-foreground">
              {" "}· {entry.input.weightKg} kg → {entry.gramsPerDay} g
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={cn(
        "inline-flex items-center gap-1.5 border-b-2 pb-1 text-xs font-medium transition-colors",
        active
          ? "border-primary text-foreground"
          : "border-transparent text-muted-foreground hover:text-foreground",
      )}
    >
      {icon}
      {label}
    </button>
  );
}
