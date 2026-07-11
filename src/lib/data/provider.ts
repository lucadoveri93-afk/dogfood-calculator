import type { Brand, FoodDatabase, Product, ProductLine } from "@/lib/types";
import db from "@/data/foods.json";
import catalog from "@/data/catalog.json";

/**
 * Layer di accesso ai dati, separato e sostituibile.
 *
 * Oggi i dati vengono dal JSON statico del progetto (JsonDataProvider).
 * Domani lo stesso contratto può essere implementato da:
 *  - un provider REST verso un backend/API ufficiali dei produttori
 *  - un provider alimentato da pipeline di scraping (vedi src/lib/data/acquisition.md)
 *  - un provider con sincronizzazione cloud e autenticazione
 * senza toccare motore di calcolo o UI.
 */
export interface DataProvider {
  getDatabase(): FoodDatabase;
  getBrands(): Brand[];
  getBrand(slug: string): Brand | undefined;
  getProductsByBrand(brandSlug: string): Product[];
  getProduct(brandSlug: string, productSlug: string): Product | undefined;
  getProductById(id: string): Product | undefined;
  /** Catalogo linee del brand (anagrafica, anche senza tabelle). */
  getLinesByBrand(brandSlug: string): ProductLine[];
}

class JsonDataProvider implements DataProvider {
  private readonly db: FoodDatabase;

  constructor(database: FoodDatabase) {
    this.db = database;
  }

  getDatabase(): FoodDatabase {
    return this.db;
  }

  getBrands(): Brand[] {
    return this.db.brands;
  }

  getBrand(slug: string): Brand | undefined {
    return this.db.brands.find((b) => b.slug === slug);
  }

  getProductsByBrand(brandSlug: string): Product[] {
    return this.db.products.filter((p) => p.brandSlug === brandSlug);
  }

  getProduct(brandSlug: string, productSlug: string): Product | undefined {
    return this.db.products.find(
      (p) => p.brandSlug === brandSlug && p.slug === productSlug,
    );
  }

  getProductById(id: string): Product | undefined {
    return this.db.products.find((p) => p.id === id);
  }

  getLinesByBrand(brandSlug: string): ProductLine[] {
    return (catalog.lines as ProductLine[]).filter(
      (l) => l.brandSlug === brandSlug,
    );
  }
}

/** Istanza condivisa. Sostituire qui l'implementazione per cambiare sorgente dati. */
export const dataProvider: DataProvider = new JsonDataProvider(
  db as FoodDatabase,
);
