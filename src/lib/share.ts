import type { CalcInput, Product } from "@/lib/types";

/**
 * Serializzazione dell'input di calcolo in URL condivisibile (QR code,
 * link diretti). L'URL apre la pagina prodotto e ricalcola la dose.
 */
export function buildSharePath(input: CalcInput, product: Product): string {
  const p = new URLSearchParams();
  p.set("w", String(input.weightKg));
  p.set("ls", input.lifeStage);
  if (input.ageMonths !== undefined) p.set("age", String(input.ageMonths));
  p.set("sex", input.sex);
  p.set("neut", input.neutered ? "1" : "0");
  p.set("act", input.activity);
  return `/${product.brandSlug}/${product.slug}?${p.toString()}`;
}

/** Decodifica difensiva dei parametri; null se mancano i campi minimi. */
export function parseShareParams(
  search: string,
): Omit<CalcInput, "productId"> | null {
  const p = new URLSearchParams(search);
  const weightKg = Number(p.get("w"));
  const lifeStage = p.get("ls");
  const sex = p.get("sex");
  const activity = p.get("act");
  if (
    !Number.isFinite(weightKg) ||
    weightKg <= 0 ||
    !["puppy", "adult", "senior"].includes(lifeStage ?? "") ||
    !["male", "female"].includes(sex ?? "") ||
    !["low", "medium", "high"].includes(activity ?? "")
  ) {
    return null;
  }
  const age = p.get("age");
  return {
    weightKg,
    lifeStage: lifeStage as CalcInput["lifeStage"],
    ageMonths: age !== null && Number.isFinite(Number(age)) ? Number(age) : undefined,
    sex: sex as CalcInput["sex"],
    neutered: p.get("neut") === "1",
    activity: activity as CalcInput["activity"],
  };
}
