"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { Scale } from "lucide-react";
import { toast } from "sonner";

import { dataProvider } from "@/lib/data/provider";
import { calculateRation } from "@/lib/engine/calculator";
import { createBrandSearch, createProductSearch } from "@/lib/search";
import type { ActivityLevel, CalcInput, CalcResult, LifeStage, Product, Sex } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { PillGroup } from "@/components/ui/pill-group";
import { ResultCard } from "@/components/calculator/result-card";

interface Slot {
  brandSlug: string | null;
  productId: string | null;
}

/** Selettore marca+prodotto riusato per i due lati del confronto. */
function ProductPicker({
  label,
  slot,
  onChange,
}: {
  label: string;
  slot: Slot;
  onChange: (slot: Slot) => void;
}) {
  const brands = dataProvider
    .getBrands()
    .filter((b) => dataProvider.getProductsByBrand(b.slug).length > 0);
  const products = useMemo(
    () => (slot.brandSlug ? dataProvider.getProductsByBrand(slot.brandSlug) : []),
    [slot.brandSlug],
  );
  const searchBrands = useMemo(() => {
    const s = createBrandSearch(brands);
    return (q: string) => s(q).map((b) => b.slug);
  }, [brands]);
  const searchProducts = useMemo(() => {
    const s = createProductSearch(products);
    return (q: string) => s(q).map((p) => p.id);
  }, [products]);

  return (
    <div className="space-y-2">
      <p className="text-sm font-medium">{label}</p>
      <Combobox
        options={brands.map((b) => ({ value: b.slug, label: b.name }))}
        value={slot.brandSlug}
        onChange={(v) => onChange({ brandSlug: v, productId: null })}
        filter={searchBrands}
        placeholder="Marca"
      />
      <Combobox
        options={products.map((p) => ({ value: p.id, label: p.name, hint: p.line }))}
        value={slot.productId}
        onChange={(v) => onChange({ ...slot, productId: v })}
        filter={searchProducts}
        placeholder={slot.brandSlug ? "Prodotto" : "Prima la marca"}
        disabled={!slot.brandSlug}
      />
    </div>
  );
}

export function CompareTool() {
  const [a, setA] = useState<Slot>({ brandSlug: null, productId: null });
  const [b, setB] = useState<Slot>({ brandSlug: null, productId: null });
  const [weightKg, setWeightKg] = useState(15);
  const [lifeStage, setLifeStage] = useState<LifeStage | null>("adult");
  const [ageMonths, setAgeMonths] = useState<number | undefined>(undefined);
  const [sex, setSex] = useState<Sex | null>("male");
  const [neutered, setNeutered] = useState(false);
  const [activity, setActivity] = useState<ActivityLevel | null>("medium");
  const [results, setResults] = useState<
    { product: Product; result: CalcResult }[] | null
  >(null);

  const canCompare =
    a.productId && b.productId && lifeStage && sex && activity &&
    (lifeStage !== "puppy" || ageMonths !== undefined);

  const onCompare = () => {
    if (!canCompare) return;
    const input: Omit<CalcInput, "productId"> = {
      weightKg,
      lifeStage: lifeStage!,
      ageMonths: lifeStage === "puppy" ? ageMonths : undefined,
      sex: sex!,
      neutered,
      activity: activity!,
    };
    try {
      const out = [a.productId!, b.productId!].map((id) => {
        const product = dataProvider.getProductById(id);
        if (!product) throw new Error("Prodotto non trovato");
        return { product, result: calculateRation(product, { ...input, productId: id }) };
      });
      setResults(out);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Errore di calcolo");
    }
  };

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <div className="mb-8 text-center">
        <h1 className="text-3xl font-semibold tracking-tight">
          Confronta due prodotti
        </h1>
        <p className="mt-2 text-muted-foreground">
          Stesso cane, due crocchette: dosi a confronto.
        </p>
      </div>

      <Card className="p-6 sm:p-8">
        <div className="grid gap-6 sm:grid-cols-2">
          <ProductPicker label="Prodotto A" slot={a} onChange={setA} />
          <ProductPicker label="Prodotto B" slot={b} onChange={setB} />
        </div>

        <div className="mt-7 space-y-6">
          <div>
            <p className="mb-2 text-sm font-medium">
              {lifeStage === "puppy" ? "Peso previsto da adulto (kg)" : "Peso (kg)"}: {weightKg}
            </p>
            <input
              type="range"
              min={1}
              max={90}
              step={0.5}
              value={weightKg}
              onChange={(e) => setWeightKg(Number(e.target.value))}
              aria-label="Peso in chilogrammi"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <p className="mb-2 text-sm font-medium">Età</p>
              <PillGroup
                aria-label="Età"
                options={[
                  { value: "puppy", label: "Cucciolo" },
                  { value: "adult", label: "Adulto" },
                  { value: "senior", label: "Senior" },
                ]}
                value={lifeStage}
                onChange={setLifeStage}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Attività</p>
              <PillGroup
                aria-label="Attività"
                options={[
                  { value: "low", label: "Bassa" },
                  { value: "medium", label: "Normale" },
                  { value: "high", label: "Alta" },
                ]}
                value={activity}
                onChange={setActivity}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Sesso</p>
              <PillGroup
                aria-label="Sesso"
                columns={2}
                options={[
                  { value: "male", label: "Maschio" },
                  { value: "female", label: "Femmina" },
                ]}
                value={sex}
                onChange={setSex}
              />
            </div>
            <div>
              <p className="mb-2 text-sm font-medium">Sterilizzato?</p>
              <PillGroup
                aria-label="Sterilizzato"
                columns={2}
                options={[
                  { value: "yes", label: "Sì" },
                  { value: "no", label: "No" },
                ]}
                value={neutered ? "yes" : "no"}
                onChange={(v) => setNeutered(v === "yes")}
              />
            </div>
          </div>
          {lifeStage === "puppy" && (
            <div>
              <p className="mb-2 text-sm font-medium">Età del cucciolo (mesi)</p>
              <input
                type="number"
                min={1}
                max={24}
                value={ageMonths ?? ""}
                onChange={(e) =>
                  setAgeMonths(e.target.value === "" ? undefined : Number(e.target.value))
                }
                placeholder="Es. 6"
                className="h-11 w-full rounded-2xl border bg-card px-4 text-sm shadow-soft outline-none focus:ring-2 focus:ring-primary sm:w-48"
              />
            </div>
          )}
        </div>

        <Button
          size="lg"
          className="mt-8 w-full"
          disabled={!canCompare}
          onClick={onCompare}
        >
          <Scale className="h-4 w-4" />
          Confronta
        </Button>
      </Card>

      {results && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
          className="mt-8 grid gap-6 md:grid-cols-2"
        >
          {results.map(({ product, result }) => {
            const brand = dataProvider.getBrand(product.brandSlug)!;
            return (
              <ResultCard
                key={product.id}
                result={result}
                brand={brand}
                product={product}
                weightKg={weightKg}
              />
            );
          })}
        </motion.div>
      )}
    </div>
  );
}
