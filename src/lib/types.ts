/**
 * Tipi di dominio condivisi da database, motore di calcolo e UI.
 */

export type ActivityLevel = "low" | "medium" | "high";
export type LifeStage = "puppy" | "adult" | "senior";
export type Sex = "male" | "female";

/** Riga con un solo valore in grammi per peso. */
export interface SingleRow {
  weightKg: number;
  grams: number;
}

/** Riga con colonne native per livello di attività (es. Royal Canin, Trainer). */
export interface ActivityRow {
  weightKg: number;
  grams: Record<ActivityLevel, number>;
}

/** Riga con intervallo min–max (es. Farmina). */
export interface RangeRow {
  weightKg: number;
  gramsMin: number;
  gramsMax: number;
}

/** Cella della matrice puppy: peso adulto previsto → grammi. */
export interface PuppyCell {
  adultWeightKg: number;
  grams: number;
}

/** Riga della matrice puppy indicizzata per età in mesi. */
export interface PuppyAgeRow {
  ageMonths: number;
  byAdultWeight: PuppyCell[];
}

export type FeedingTable =
  | { kind: "single"; lifeStage: LifeStage; rows: SingleRow[] }
  | { kind: "activity"; lifeStage: LifeStage; rows: ActivityRow[] }
  | { kind: "range"; lifeStage: LifeStage; rows: RangeRow[] }
  | { kind: "puppyByAge"; lifeStage: "puppy"; rows: PuppyAgeRow[] };

export interface Product {
  id: string;
  slug: string;
  brandSlug: string;
  name: string;
  line?: string;
  lifeStages: LifeStage[];
  /** Range di peso target dichiarato dal produttore, se presente. */
  targetWeightKg?: [number, number];
  kcalPerKg?: number;
  tables: FeedingTable[];
  notes?: string[];
  sourceUrl?: string;
  /** Data di acquisizione del dato dal sito del produttore. */
  sourceDate?: string;
}

export interface Brand {
  slug: string;
  name: string;
  description?: string;
  /** Paese d'origine del brand (catalogo). */
  country?: string;
}

/**
 * Linea di prodotto a catalogo (es. "Size Health Nutrition → Mini Puppy").
 * È anagrafica: una linea diventa calcolabile solo quando uno o più
 * Product con tabella ufficiale la referenziano tramite productIds.
 */
export interface ProductLine {
  id: string;
  brandSlug: string;
  /** Gruppo/linea commerciale (es. "Size Health Nutrition", "Vet Life"). */
  group: string;
  name: string;
  /** Categoria della linea (mantenimento, per razza, veterinaria, ...). */
  category: string;
  /** true se il calcolo richiede la tabella ufficiale del produttore. */
  needsFeedingTable: boolean;
  /** Linea veterinaria: dosaggio solo su indicazione del veterinario. */
  vet?: boolean;
  /** Prodotti già presenti nel DB con tabella ufficiale per questa linea. */
  productIds?: string[];
}

export interface FoodDatabase {
  version: number;
  updatedAt: string;
  brands: Brand[];
  products: Product[];
  /** Catalogo linee (anagrafica); opzionale, vive in catalog.json. */
  lines?: ProductLine[];
}

/** Input del calcolo, prodotto dal form. */
export interface CalcInput {
  productId: string;
  weightKg: number;
  lifeStage: LifeStage;
  /** Richiesto solo se lifeStage === "puppy". */
  ageMonths?: number;
  sex: Sex;
  neutered: boolean;
  activity: ActivityLevel;
}

export interface AppliedModifier {
  label: string;
  factor: number;
}

export interface CalcResult {
  gramsPerDay: number;
  gramsPerMealTwo: number;
  gramsPerMealThree: number;
  /** Valore letto/interpolato dalla tabella, prima dei modificatori. */
  baseGrams: number;
  modifiers: AppliedModifier[];
  notes: string[];
  usedTable: FeedingTable["kind"];
}
