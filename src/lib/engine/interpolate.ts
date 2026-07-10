/**
 * Interpolazione lineare su punti (x, y) ordinabili.
 * Fuori dal range dei punti il valore viene bloccato agli estremi (clamp):
 * estrapolare una curva di razionamento oltre i dati del produttore
 * produrrebbe dosi non supportate da alcuna fonte.
 */
export interface InterpolationResult {
  value: number;
  clamped: "below" | "above" | null;
}

export function interpolate(
  points: ReadonlyArray<{ x: number; y: number }>,
  x: number,
): InterpolationResult {
  if (points.length === 0) {
    throw new Error("interpolate: nessun punto disponibile");
  }
  const sorted = [...points].sort((a, b) => a.x - b.x);

  const first = sorted[0];
  const last = sorted[sorted.length - 1];
  if (x <= first.x) {
    return { value: first.y, clamped: x < first.x ? "below" : null };
  }
  if (x >= last.x) {
    return { value: last.y, clamped: x > last.x ? "above" : null };
  }

  for (let i = 0; i < sorted.length - 1; i++) {
    const a = sorted[i];
    const b = sorted[i + 1];
    if (x >= a.x && x <= b.x) {
      const t = (x - a.x) / (b.x - a.x);
      return { value: a.y + t * (b.y - a.y), clamped: null };
    }
  }
  // Irraggiungibile, ma il type-checker non lo sa.
  return { value: last.y, clamped: null };
}
