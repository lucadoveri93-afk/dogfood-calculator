import type {
  ActivityLevel,
  AppliedModifier,
  CalcInput,
  CalcResult,
  FeedingTable,
  LifeStage,
  Product,
} from "@/lib/types";
import { interpolate } from "./interpolate";

/**
 * Politica dei modificatori.
 *
 * - I modificatori di attività si applicano SOLO se la tabella del prodotto
 *   non ha già colonne native per attività: in quel caso il dato del
 *   produttore prevale sempre sulla correzione generica.
 * - Sterilizzazione: -10% (fabbisogno energetico ridotto).
 * - Senior: -5%, ma non se la tabella usata è già calibrata per senior.
 * - Cucciolo: si usa la tabella puppy se disponibile; nessun modificatore
 *   percentuale, perché le tabelle puppy sono già specifiche per età.
 * - Il sesso non applica modificatori: non esiste un fattore standard
 *   riconosciuto; viene comunque registrato per usi futuri (kcal, profili).
 */
const NEUTERED_FACTOR = 0.9;
const SENIOR_FACTOR = 0.95;
const ACTIVITY_FACTORS: Record<ActivityLevel, number> = {
  low: 0.9,
  medium: 1,
  high: 1.15,
};

function pickTable(
  product: Product,
  lifeStage: LifeStage,
): { table: FeedingTable; notes: string[] } {
  const notes: string[] = [];

  if (lifeStage === "puppy") {
    const puppy = product.tables.find((t) => t.kind === "puppyByAge");
    if (puppy) return { table: puppy, notes };
    notes.push(
      "Questo prodotto non ha una tabella specifica per cuccioli: il valore deriva dalla tabella adulti e va confermato con il veterinario.",
    );
  }

  const exact = product.tables.find(
    (t) => t.lifeStage === lifeStage && t.kind !== "puppyByAge",
  );
  const fallback = product.tables.find((t) => t.kind !== "puppyByAge");
  const table = exact ?? fallback;
  if (!table) {
    throw new Error(`Nessuna tabella utilizzabile per il prodotto ${product.id}`);
  }
  return { table, notes };
}

function baseFromTable(
  table: FeedingTable,
  input: CalcInput,
  notes: string[],
): { grams: number; activityHandledNatively: boolean } {
  switch (table.kind) {
    case "single": {
      const r = interpolate(
        table.rows.map((row) => ({ x: row.weightKg, y: row.grams })),
        input.weightKg,
      );
      pushClampNote(r.clamped, notes);
      return { grams: r.value, activityHandledNatively: false };
    }
    case "activity": {
      const r = interpolate(
        table.rows.map((row) => ({
          x: row.weightKg,
          y: row.grams[input.activity],
        })),
        input.weightKg,
      );
      pushClampNote(r.clamped, notes);
      return { grams: r.value, activityHandledNatively: true };
    }
    case "range": {
      const mid = interpolate(
        table.rows.map((row) => ({
          x: row.weightKg,
          y: (row.gramsMin + row.gramsMax) / 2,
        })),
        input.weightKg,
      );
      pushClampNote(mid.clamped, notes);
      notes.push(
        "Il produttore indica un intervallo min–max: il calcolo parte dal punto medio.",
      );
      return { grams: mid.value, activityHandledNatively: false };
    }
    case "puppyByAge": {
      const age = input.ageMonths;
      if (age === undefined) {
        throw new Error(
          "Per un cucciolo è necessaria l'età in mesi per usare la tabella puppy.",
        );
      }
      // Interpolazione bilineare: prima sul peso adulto previsto per ogni
      // riga di età, poi sull'età.
      const byAge = table.rows.map((row) => {
        const r = interpolate(
          row.byAdultWeight.map((c) => ({ x: c.adultWeightKg, y: c.grams })),
          input.weightKg,
        );
        return { x: row.ageMonths, y: r.value, clamped: r.clamped };
      });
      if (byAge.some((p) => p.clamped !== null)) {
        notes.push(
          "Il peso adulto previsto è fuori dall'intervallo coperto dalla tabella puppy: valore bloccato all'estremo più vicino.",
        );
      }
      const r = interpolate(byAge, age);
      if (r.clamped) {
        notes.push(
          "L'età indicata è fuori dall'intervallo della tabella puppy: valore bloccato all'estremo più vicino.",
        );
      }
      notes.push(
        "Per i cuccioli il peso da inserire è il peso previsto da adulto, come indicato dal produttore.",
      );
      // L'attività non si applica ai cuccioli: le tabelle puppy sono già
      // calibrate sul fabbisogno di crescita.
      return { grams: r.value, activityHandledNatively: true };
    }
  }
}

function pushClampNote(clamped: "below" | "above" | null, notes: string[]) {
  if (clamped === "below") {
    notes.push(
      "Il peso indicato è sotto il minimo della tabella del produttore: la dose è quella del peso minimo coperto.",
    );
  } else if (clamped === "above") {
    notes.push(
      "Il peso indicato è sopra il massimo della tabella del produttore: la dose è quella del peso massimo coperto. Chiedi conferma al veterinario.",
    );
  }
}

/** Arrotonda ai grammi interi: la precisione oltre il grammo è fittizia. */
const round = (g: number) => Math.round(g);

export function calculateRation(product: Product, input: CalcInput): CalcResult {
  const notes: string[] = [];
  const { table, notes: tableNotes } = pickTable(product, input.lifeStage);
  notes.push(...tableNotes);

  const { grams: baseGrams, activityHandledNatively } = baseFromTable(
    table,
    input,
    notes,
  );

  const modifiers: AppliedModifier[] = [];

  if (!activityHandledNatively && input.activity !== "medium") {
    modifiers.push({
      label: input.activity === "high" ? "Attività alta" : "Attività bassa",
      factor: ACTIVITY_FACTORS[input.activity],
    });
  }

  if (input.neutered) {
    modifiers.push({ label: "Sterilizzato", factor: NEUTERED_FACTOR });
  }

  const tableIsSeniorCalibrated = table.lifeStage === "senior";
  if (input.lifeStage === "senior" && !tableIsSeniorCalibrated) {
    modifiers.push({ label: "Senior", factor: SENIOR_FACTOR });
  }

  const gramsPerDay = round(
    modifiers.reduce((g, m) => g * m.factor, baseGrams),
  );

  if (
    product.targetWeightKg &&
    (input.weightKg < product.targetWeightKg[0] ||
      input.weightKg > product.targetWeightKg[1]) &&
    input.lifeStage !== "puppy"
  ) {
    notes.push(
      `Questo prodotto è pensato per cani da ${product.targetWeightKg[0]} a ${product.targetWeightKg[1]} kg: valuta un prodotto della taglia corretta.`,
    );
  }

  notes.push(
    "Dose indicativa basata sulla tabella del produttore: verifica sempre sulla confezione e adattala alla condizione corporea del cane.",
  );

  return {
    gramsPerDay,
    gramsPerMealTwo: round(gramsPerDay / 2),
    gramsPerMealThree: round(gramsPerDay / 3),
    baseGrams: round(baseGrams),
    modifiers,
    notes,
    usedTable: table.kind,
  };
}
