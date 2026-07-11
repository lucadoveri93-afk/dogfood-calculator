import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { dataProvider } from "@/lib/data/provider";

interface Params {
  brand: string;
}

export function generateStaticParams(): Params[] {
  return dataProvider.getBrands().map((b) => ({ brand: b.slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: Params }): Metadata {
  const brand = dataProvider.getBrand(params.brand);
  if (!brand) return {};
  return {
    title: `Crocchette ${brand.name}: dosi giornaliere consigliate`,
    description: `Calcola la razione giornaliera per i prodotti ${brand.name} in base a peso, età e attività del tuo cane. Tabelle ufficiali del produttore.`,
    alternates: { canonical: `/${brand.slug}` },
  };
}

export default function BrandPage({ params }: { params: Params }) {
  const brand = dataProvider.getBrand(params.brand);
  if (!brand) notFound();

  const products = dataProvider.getProductsByBrand(brand.slug);

  return (
    <div className="mx-auto max-w-2xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">{brand.name}</h1>
      {brand.description && (
        <p className="mt-2 text-muted-foreground">{brand.description}</p>
      )}
      <div className="mt-8 space-y-3">
        {products.map((p) => (
          <Link key={p.id} href={`/${brand.slug}/${p.slug}`} className="block">
            <Card className="flex items-center justify-between p-5 transition-shadow hover:shadow-soft-lg">
              <div>
                <p className="font-medium">{p.name}</p>
                <p className="mt-0.5 text-sm text-muted-foreground">
                  {p.line}
                  {p.targetWeightKg &&
                    ` · ${p.targetWeightKg[0]}–${p.targetWeightKg[1]} kg`}
                </p>
              </div>
              <ArrowRight className="h-4 w-4 shrink-0 text-muted-foreground" />
            </Card>
          </Link>
        ))}
      </div>

      <LineCatalog brandSlug={brand.slug} />
    </div>
  );
}

/** Catalogo linee del brand: le voci senza tabella sono segnate "in arrivo". */
function LineCatalog({ brandSlug }: { brandSlug: string }) {
  const lines = dataProvider.getLinesByBrand(brandSlug);
  if (lines.length === 0) return null;

  const groups = new Map<string, typeof lines>();
  for (const line of lines) {
    const list = groups.get(line.group) ?? [];
    list.push(line);
    groups.set(line.group, list);
  }

  return (
    <section className="mt-12">
      <h2 className="text-lg font-semibold">Tutte le linee {""}</h2>
      <p className="mt-1 text-sm text-muted-foreground">
        Il calcolo è disponibile per le linee con tabella ufficiale già
        acquisita; le altre sono in lavorazione.
      </p>
      <div className="mt-5 space-y-6">
        {Array.from(groups.entries()).map(([group, items]) => (
          <div key={group}>
            <h3 className="mb-2 text-sm font-medium text-muted-foreground">
              {group}
              {items[0]?.vet && " · uso veterinario"}
            </h3>
            <div className="flex flex-wrap gap-2">
              {items.map((line) => {
                const available = (line.productIds?.length ?? 0) > 0;
                return (
                  <span
                    key={line.id}
                    className={
                      available
                        ? "rounded-full bg-primary/10 px-3 py-1.5 text-xs font-medium text-primary"
                        : "rounded-full border px-3 py-1.5 text-xs text-muted-foreground"
                    }
                  >
                    {line.name}
                    {available ? " ✓" : ""}
                  </span>
                );
              })}
            </div>
          </div>
        ))}
      </div>
      <p className="mt-4 text-xs text-muted-foreground">
        Le linee veterinarie richiedono il dosaggio indicato dal veterinario:
        verranno aggiunte al calcolatore con avvertenze dedicate.
      </p>
    </section>
  );
}
