import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { Calculator } from "@/components/calculator/calculator";
import { dataProvider } from "@/lib/data/provider";

interface Params {
  brand: string;
  product: string;
}

export function generateStaticParams(): Params[] {
  return dataProvider
    .getDatabase()
    .products.map((p) => ({ brand: p.brandSlug, product: p.slug }));
}

export const dynamicParams = false;

export function generateMetadata({ params }: { params: Params }): Metadata {
  const product = dataProvider.getProduct(params.brand, params.product);
  const brand = dataProvider.getBrand(params.brand);
  if (!product || !brand) return {};
  return {
    title: `${brand.name} ${product.name}: quanti grammi al giorno?`,
    description: `Dose giornaliera di ${brand.name} ${product.name} calcolata sulla tabella ufficiale: inserisci peso, età e attività del tuo cane.`,
    alternates: { canonical: `/${brand.slug}/${product.slug}` },
  };
}

export default function ProductPage({ params }: { params: Params }) {
  const product = dataProvider.getProduct(params.brand, params.product);
  const brand = dataProvider.getBrand(params.brand);
  if (!product || !brand) notFound();

  return (
    <div className="py-6">
      <div className="mx-auto max-w-xl px-4 pt-8">
        <h1 className="text-2xl font-semibold tracking-tight">
          {brand.name} {product.name}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Calcola la dose giornaliera per questo prodotto.
        </p>
      </div>
      <Calculator initialBrandSlug={brand.slug} initialProductId={product.id} />
    </div>
  );
}
