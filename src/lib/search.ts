import Fuse from "fuse.js";
import type { Brand, Product } from "@/lib/types";

/**
 * Ricerca fuzzy istantanea su marche e prodotti (Fuse.js).
 * Le istanze Fuse sono costruite una volta per lista e riusate.
 */
export function createBrandSearch(brands: Brand[]) {
  const fuse = new Fuse(brands, {
    keys: ["name"],
    threshold: 0.35,
    ignoreLocation: true,
  });
  return (query: string): Brand[] =>
    query.trim() === "" ? brands : fuse.search(query).map((r) => r.item);
}

export function createProductSearch(products: Product[]) {
  const fuse = new Fuse(products, {
    keys: ["name", "line"],
    threshold: 0.35,
    ignoreLocation: true,
  });
  return (query: string): Product[] =>
    query.trim() === "" ? products : fuse.search(query).map((r) => r.item);
}

/** Ricerca fuzzy generica su opzioni {value,label,hint} già costruite. */
export function createOptionSearch<
  T extends { value: string; label: string; hint?: string },
>(options: T[]) {
  const fuse = new Fuse(options, {
    keys: ["label", "hint"],
    threshold: 0.35,
    ignoreLocation: true,
  });
  return (query: string): string[] =>
    (query.trim() === "" ? options : fuse.search(query).map((r) => r.item)).map(
      (o) => o.value,
    );
}
