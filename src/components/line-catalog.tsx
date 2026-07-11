import Link from "next/link";
import { dataProvider } from "@/lib/data/provider";

/**
 * Catalogo linee di un brand, raggruppato per linea commerciale.
 * Chip verde ✓ = linea con tabella ufficiale (calcolabile);
 * chip grigio = a catalogo, tabella in lavorazione.
 */
export function LineCatalog({
  brandSlug,
  showTitle = true,
}: {
  brandSlug: string;
  showTitle?: boolean;
}) {
  const lines = dataProvider.getLinesByBrand(brandSlug);
  if (lines.length === 0) return null;

  const groups = new Map<string, typeof lines>();
  for (const line of lines) {
    const list = groups.get(line.group) ?? [];
    list.push(line);
    groups.set(line.group, list);
  }

  const products = dataProvider.getProductsByBrand(brandSlug);
  const productBySlug = new Map(products.map((p) => [p.id, p.slug]));

  return (
    <section className={showTitle ? "mt-12" : ""}>
      {showTitle && (
        <>
          <h2 className="text-lg font-semibold">Tutte le linee</h2>
          <p className="mt-1 text-sm text-muted-foreground">
            Il calcolo è disponibile per le linee con tabella ufficiale già
            acquisita; le altre sono in lavorazione.
          </p>
        </>
      )}
      <div className="mt-5 space-y-6">
        {Array.from(groups.entries()).map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {group}
              {items[0]?.vet && " · uso veterinario"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((line) => {
                const firstProductId = line.productIds?.[0];
                const productSlug = firstProductId
                  ? productBySlug.get(firstProductId)
                  : undefined;
                if (productSlug) {
                  return (
                    <Link
                      key={line.id}
                      href={`/${brandSlug}/${productSlug}`}
                      className="rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary transition-colors hover:bg-primary/20"
                    >
                      {line.name} ✓
                    </Link>
                  );
                }
                return (
                  <span
                    key={line.id}
                    className="rounded-full border px-3 py-1.5 text-xs text-muted-foreground"
                  >
                    {line.name}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      {showTitle && (
        <p className="mt-4 text-xs text-muted-foreground">
          Le linee veterinarie richiedono il dosaggio indicato dal veterinario:
          verranno aggiunte al calcolatore con avvertenze dedicate.
        </p>
      )}
    </section>
  );
}
