"use client";

import { motion } from "framer-motion";
import { Info, UtensilsCrossed } from "lucide-react";
import { Card } from "@/components/ui/card";
import type { Brand, CalcResult, Product } from "@/lib/types";

interface ResultCardProps {
  result: CalcResult;
  brand: Brand;
  product: Product;
  weightKg: number;
}

export function ResultCard({ result, brand, product, weightKg }: ResultCardProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
    >
      <Card className="overflow-hidden">
        <div className="bg-primary px-8 pb-10 pt-8 text-center text-primary-foreground">
          <p className="text-sm font-medium uppercase tracking-widest opacity-80">
            Dose consigliata
          </p>
          <p className="mt-2 text-6xl font-semibold tracking-tight">
            {result.gramsPerDay}
            <span className="ml-1 text-2xl font-normal opacity-80">g</span>
          </p>
          <p className="mt-1 text-sm opacity-80">al giorno</p>
        </div>

        <div className="grid grid-cols-2 divide-x border-b">
          <div className="px-6 py-5 text-center">
            <UtensilsCrossed className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
            <p className="text-2xl font-semibold">{result.gramsPerMealTwo} g</p>
            <p className="text-xs text-muted-foreground">× 2 pasti</p>
          </div>
          <div className="px-6 py-5 text-center">
            <UtensilsCrossed className="mx-auto mb-1.5 h-4 w-4 text-muted-foreground" />
            <p className="text-2xl font-semibold">{result.gramsPerMealThree} g</p>
            <p className="text-xs text-muted-foreground">× 3 pasti</p>
          </div>
        </div>

        <dl className="space-y-2 px-8 py-6 text-sm">
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Marca</dt>
            <dd className="text-right font-medium">{brand.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Prodotto</dt>
            <dd className="text-right font-medium">{product.name}</dd>
          </div>
          <div className="flex justify-between gap-4">
            <dt className="text-muted-foreground">Peso del cane</dt>
            <dd className="text-right font-medium">{weightKg} kg</dd>
          </div>
          {result.modifiers.length > 0 && (
            <div className="flex justify-between gap-4">
              <dt className="text-muted-foreground">Correzioni</dt>
              <dd className="text-right font-medium">
                {result.modifiers
                  .map(
                    (m) =>
                      `${m.label} ${m.factor > 1 ? "+" : "−"}${Math.round(
                        Math.abs(m.factor - 1) * 100,
                      )}%`,
                  )
                  .join(", ")}
              </dd>
            </div>
          )}
        </dl>

        {result.notes.length > 0 && (
          <div className="border-t bg-muted/50 px-8 py-5">
            <ul className="space-y-2">
              {result.notes.map((note) => (
                <li
                  key={note}
                  className="flex gap-2 text-xs leading-relaxed text-muted-foreground"
                >
                  <Info className="mt-0.5 h-3.5 w-3.5 shrink-0" />
                  {note}
                </li>
              ))}
            </ul>
          </div>
        )}
      </Card>
    </motion.div>
  );
}
