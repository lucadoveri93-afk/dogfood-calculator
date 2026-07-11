/**
 * Validazione strutturale del database con Zod.
 * Uso: npm run validate:db
 * La pipeline di acquisizione dati DEVE far passare questo script
 * prima di pubblicare un nuovo foods.json.
 */
import { z } from "zod";
import db from "../src/data/foods.json";

const lifeStage = z.enum(["puppy", "adult", "senior"]);
const positive = z.number().positive();

const singleRow = z.object({ weightKg: positive, grams: positive });
const activityRow = z.object({
  weightKg: positive,
  grams: z.object({ low: positive, medium: positive, high: positive }),
});
const rangeRow = z
  .object({ weightKg: positive, gramsMin: positive, gramsMax: positive })
  .refine((r) => r.gramsMax >= r.gramsMin, "gramsMax < gramsMin");
const puppyAgeRow = z.object({
  ageMonths: positive,
  byAdultWeight: z
    .array(z.object({ adultWeightKg: positive, grams: positive }))
    .min(2),
});

const table = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("single"), lifeStage, rows: z.array(singleRow).min(2) }),
  z.object({ kind: z.literal("activity"), lifeStage, rows: z.array(activityRow).min(2) }),
  z.object({ kind: z.literal("range"), lifeStage, rows: z.array(rangeRow).min(2) }),
  z.object({ kind: z.literal("puppyByAge"), lifeStage: z.literal("puppy"), rows: z.array(puppyAgeRow).min(2) }),
]);

const product = z.object({
  id: z.string().min(1),
  slug: z.string().regex(/^[a-z0-9-]+$/),
  brandSlug: z.string().regex(/^[a-z0-9-]+$/),
  name: z.string().min(1),
  line: z.string().optional(),
  lifeStages: z.array(lifeStage).min(1),
  targetWeightKg: z.tuple([positive, positive]).optional(),
  kcalPerKg: positive.optional(),
  tables: z.array(table).min(1),
  vet: z.boolean().optional(),
  notes: z.array(z.string()).optional(),
  sourceUrl: z.string().url().optional(),
  sourceDate: z.string().optional(),
});

const database = z.object({
  version: z.number().int().positive(),
  updatedAt: z.string(),
  brands: z.array(z.object({ slug: z.string(), name: z.string(), description: z.string().optional() })).min(1),
  products: z.array(product).min(1),
});

const parsed = database.parse(db);

// --- Catalogo linee (anagrafica) ---
import catalog from "../src/data/catalog.json";

const line = z.object({
  id: z.string().regex(/^[a-z0-9-]+$/),
  brandSlug: z.string(),
  group: z.string().min(1),
  name: z.string().min(1),
  category: z.string().min(1),
  needsFeedingTable: z.boolean(),
  vet: z.boolean().optional(),
  productIds: z.array(z.string()).optional(),
  tableUnavailable: z.boolean().optional(),
});
const catalogSchema = z.object({
  version: z.number().int().positive(),
  updatedAt: z.string(),
  lines: z.array(line).min(1),
});
const parsedCatalog = catalogSchema.parse(catalog);

// Coerenza referenziale: ogni prodotto punta a una marca esistente,
// slug unici per marca.
const brandSlugs = new Set(parsed.brands.map((b) => b.slug));
const seen = new Set<string>();
for (const p of parsed.products) {
  if (!brandSlugs.has(p.brandSlug)) {
    throw new Error(`Prodotto ${p.id}: marca inesistente '${p.brandSlug}'`);
  }
  const key = `${p.brandSlug}/${p.slug}`;
  if (seen.has(key)) throw new Error(`Slug duplicato: ${key}`);
  seen.add(key);
}

// Coerenza catalogo: brand esistenti, id linea unici, productIds validi.
const productIds = new Set(parsed.products.map((p) => p.id));
const lineIds = new Set<string>();
for (const l of parsedCatalog.lines) {
  if (!brandSlugs.has(l.brandSlug)) {
    throw new Error(`Linea ${l.id}: marca inesistente '${l.brandSlug}'`);
  }
  if (lineIds.has(l.id)) throw new Error(`Linea duplicata: ${l.id}`);
  lineIds.add(l.id);
  for (const pid of l.productIds ?? []) {
    if (!productIds.has(pid)) {
      throw new Error(`Linea ${l.id}: productId inesistente '${pid}'`);
    }
  }
}

const covered = parsedCatalog.lines.filter(
  (l) => (l.productIds?.length ?? 0) > 0,
).length;
console.log(
  `DB valido: ${parsed.brands.length} marche, ${parsed.products.length} prodotti, ` +
    `${parsedCatalog.lines.length} linee a catalogo (${covered} con tabella).`,
);
