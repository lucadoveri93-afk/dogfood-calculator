import type { CalcInput } from "@/lib/types";

/**
 * Persistenza locale (Local Storage): ultima ricerca, cronologia, preferiti.
 * Tutte le letture sono difensive: dati corrotti → valore vuoto, mai crash.
 */
const LAST_SEARCH_KEY = "dogfood:last-search:v1";
const HISTORY_KEY = "dogfood:history:v1";
const FAVORITES_KEY = "dogfood:favorites:v1";
const HISTORY_LIMIT = 20;

export interface HistoryEntry {
  input: CalcInput;
  gramsPerDay: number;
  brandName: string;
  productName: string;
  timestamp: number;
}

/** Chiave stabile di un input: identifica una ricerca a parità di parametri. */
export function inputKey(input: CalcInput): string {
  return [
    input.productId,
    input.weightKg,
    input.lifeStage,
    input.ageMonths ?? "",
    input.sex,
    input.neutered ? 1 : 0,
    input.activity,
  ].join("|");
}

function read<T>(key: string, fallback: T): T {
  if (typeof window === "undefined") return fallback;
  try {
    const raw = window.localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : fallback;
  } catch {
    return fallback;
  }
}

function write(key: string, value: unknown): void {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(key, JSON.stringify(value));
  } catch {
    // storage pieno o negato: non bloccante
  }
}

// --- Ultima ricerca ---

export function saveLastSearch(input: CalcInput): void {
  write(LAST_SEARCH_KEY, input);
}

export function loadLastSearch(): CalcInput | null {
  const parsed = read<CalcInput | null>(LAST_SEARCH_KEY, null);
  if (
    !parsed ||
    typeof parsed.productId !== "string" ||
    typeof parsed.weightKg !== "number"
  ) {
    return null;
  }
  return parsed;
}

// --- Cronologia ---

export function addToHistory(entry: HistoryEntry): void {
  const list = loadHistory().filter(
    (e) => inputKey(e.input) !== inputKey(entry.input),
  );
  list.unshift(entry);
  write(HISTORY_KEY, list.slice(0, HISTORY_LIMIT));
}

export function loadHistory(): HistoryEntry[] {
  const list = read<HistoryEntry[]>(HISTORY_KEY, []);
  return Array.isArray(list) ? list.filter((e) => e && e.input) : [];
}

export function clearHistory(): void {
  write(HISTORY_KEY, []);
}

// --- Preferiti ---

export function loadFavorites(): HistoryEntry[] {
  const list = read<HistoryEntry[]>(FAVORITES_KEY, []);
  return Array.isArray(list) ? list.filter((e) => e && e.input) : [];
}

export function isFavorite(input: CalcInput): boolean {
  return loadFavorites().some((e) => inputKey(e.input) === inputKey(input));
}

/** Aggiunge o rimuove dai preferiti. Restituisce il nuovo stato. */
export function toggleFavorite(entry: HistoryEntry): boolean {
  const list = loadFavorites();
  const key = inputKey(entry.input);
  const without = list.filter((e) => inputKey(e.input) !== key);
  const added = without.length === list.length;
  if (added) without.unshift(entry);
  write(FAVORITES_KEY, without);
  return added;
}
