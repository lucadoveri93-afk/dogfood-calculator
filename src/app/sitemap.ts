import type { MetadataRoute } from "next";
import { dataProvider } from "@/lib/data/provider";

const BASE = "https://dogfood-calculator.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const db = dataProvider.getDatabase();
  return [
    { url: BASE, changeFrequency: "weekly", priority: 1 },
    { url: `${BASE}/catalogo`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE}/confronto`, changeFrequency: "monthly", priority: 0.7 },
    ...db.brands.map((b) => ({
      url: `${BASE}/${b.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    })),
    ...db.products.map((p) => ({
      url: `${BASE}/${p.brandSlug}/${p.slug}`,
      changeFrequency: "monthly" as const,
      priority: 0.6,
    })),
  ];
}
