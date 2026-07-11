import type { Metadata } from "next";
import Link from "next/link";
import { ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/card";
import { LineCatalog } from "@/components/line-catalog";
import { dataProvider } from "@/lib/data/provider";

export const metadata: Metadata = {
  title: "Catalogo marche e linee di crocchette",
  description:
    "Tutte le marche e le linee di crocchette per cani a catalogo: quelle con tabella ufficiale sono calcolabili subito, le altre sono in lavorazione.",
  alternates: { canonical: "/catalogo" },
};

export default function CatalogPage() {
  const brands = dataProvider.getBrands();
  const db = dataProvider.getDatabase();

  return (
    <div className="mx-auto max-w-3xl px-4 py-14">
      <h1 className="text-3xl font-semibold tracking-tight">Catalogo completo</h1>
      <p className="mt-2 text-muted-foreground">
        {brands.length} marche a catalogo. Le linee con ✓ hanno la tabella
        ufficiale del produttore e sono calcolabili; le altre sono in
        lavorazione.
      </p>

      <div className="mt-8 space-y-6">
        {brands.map((brand) => {
          const products = dataProvider.getProductsByBrand(brand.slug);
          return (
            <Card key={brand.slug} className="p-6 sm:p-8">
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold">
                    <Link href={`/${brand.slug}`} className="hover:underline">
                      {brand.name}
                    </Link>
                  </h2>
                  <p className="mt-0.5 text-sm text-muted-foreground">
                    {brand.country && `${brand.country} · `}
                    {products.length > 0
                      ? `${products.length} prodotti calcolabili`
                      : "tabelle in lavorazione"}
                  </p>
                </div>
                <Link
                  href={`/${brand.slug}`}
                  className="inline-flex shrink-0 items-center gap-1 text-sm text-primary hover:underline"
                >
                  Apri <ArrowRight className="h-3.5 w-3.5" />
                </Link>
              </div>
              <LineCatalog brandSlug={brand.slug} showTitle={false} />
            </Card>
          );
        })}
      </div>

      <p className="mt-8 text-xs text-muted-foreground">
        Database v{db.version}, aggiornato al {db.updatedAt}. Le linee
        veterinarie richiedono il dosaggio indicato dal veterinario.
      </p>
    </div>
  );
}
