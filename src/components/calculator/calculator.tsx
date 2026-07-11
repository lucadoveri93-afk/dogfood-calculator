"use client";

import { useEffect, useMemo, useState } from "react";
import { AnimatePresence, motion } from "framer-motion";
import { useForm, Controller } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { toast } from "sonner";
import {
  ArrowLeft,
  ArrowRight,
  Printer,
  QrCode,
  RotateCcw,
  Star,
} from "lucide-react";

import { dataProvider } from "@/lib/data/provider";
import { calculateRation } from "@/lib/engine/calculator";
import { createBrandSearch, createOptionSearch } from "@/lib/search";
import {
  addToHistory,
  isFavorite,
  loadLastSearch,
  saveLastSearch,
  toggleFavorite,
  type HistoryEntry,
} from "@/lib/storage";
import { buildSharePath, parseShareParams } from "@/lib/share";
import type { CalcInput, CalcResult } from "@/lib/types";

import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Combobox } from "@/components/ui/combobox";
import { PillGroup } from "@/components/ui/pill-group";
import { Skeleton } from "@/components/ui/skeleton";
import { ResultCard } from "@/components/calculator/result-card";
import { calcFormSchema, type CalcFormValues } from "@/components/calculator/schema";
import { HistoryStrip } from "@/components/history-strip";
import { QrDialog } from "@/components/qr-dialog";

type Phase = "hero" | "form" | "loading" | "result";

const defaultValues: Partial<CalcFormValues> = {
  brandSlug: "",
  productId: "",
  weightKg: 15,
  neutered: false,
};

const fade = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.35, ease: [0.22, 1, 0.36, 1] as const },
};

interface CalculatorProps {
  /** Preselezione da pagine SEO marca/prodotto. */
  initialBrandSlug?: string;
  initialProductId?: string;
}

export function Calculator({ initialBrandSlug, initialProductId }: CalculatorProps) {
  const [phase, setPhase] = useState<Phase>(
    initialBrandSlug ? "form" : "hero",
  );
  const [result, setResult] = useState<CalcResult | null>(null);
  const [lastInput, setLastInput] = useState<CalcInput | null>(null);
  const [qrOpen, setQrOpen] = useState(false);
  const [starred, setStarred] = useState(false);

  // Solo marche con almeno un prodotto calcolabile: le altre sono a
  // catalogo ma senza tabella, e nel form sarebbero vicoli ciechi.
  const brands = dataProvider
    .getBrands()
    .filter((b) => dataProvider.getProductsByBrand(b.slug).length > 0);

  const {
    control,
    watch,
    setValue,
    handleSubmit,
    reset,
    formState: { errors, isValid },
  } = useForm<CalcFormValues>({
    resolver: zodResolver(calcFormSchema),
    mode: "onChange",
    defaultValues: {
      ...defaultValues,
      brandSlug: initialBrandSlug ?? "",
      productId: initialProductId ?? "",
    },
  });

  const brandSlug = watch("brandSlug");
  const productId = watch("productId");
  const weightKg = watch("weightKg");
  const lifeStage = watch("lifeStage");

  const products = useMemo(
    () => (brandSlug ? dataProvider.getProductsByBrand(brandSlug) : []),
    [brandSlug],
  );

  // Menu Prodotto: prodotti calcolabili (selezionabili) + tutte le altre
  // linee a catalogo della marca, visibili ma disabilitate ("in arrivo").
  const productOptions = useMemo(() => {
    if (!brandSlug) return [];
    const calculable = products.map((p) => ({
      value: p.id,
      label: p.name,
      hint: p.line,
    }));
    const covered = new Set(
      dataProvider
        .getLinesByBrand(brandSlug)
        .filter((l) => (l.productIds?.length ?? 0) > 0)
        .map((l) => l.id),
    );
    const pending = dataProvider
      .getLinesByBrand(brandSlug)
      .filter((l) => !covered.has(l.id))
      .map((l) => ({
        value: `line:${l.id}`,
        label: l.name,
        hint: `${l.group} · in arrivo${l.vet ? " · veterinario" : ""}`,
        disabled: true,
      }));
    return [...calculable, ...pending];
  }, [brandSlug, products]);

  const searchBrands = useMemo(() => {
    const search = createBrandSearch(brands);
    return (q: string) => search(q).map((b) => b.slug);
  }, [brands]);

  const searchProducts = useMemo(
    () => createOptionSearch(productOptions),
    [productOptions],
  );

  // Link condiviso (QR): se l'URL della pagina prodotto contiene i parametri,
  // precompila e calcola subito.
  useEffect(() => {
    if (!initialProductId || typeof window === "undefined") return;
    const shared = parseShareParams(window.location.search);
    if (!shared) return;
    const product = dataProvider.getProductById(initialProductId);
    if (!product) return;
    const input: CalcInput = { ...shared, productId: initialProductId };
    reset({
      brandSlug: product.brandSlug,
      productId: product.id,
      weightKg: shared.weightKg,
      lifeStage: shared.lifeStage,
      ageMonths: shared.ageMonths,
      sex: shared.sex,
      neutered: shared.neutered,
      activity: shared.activity,
    });
    try {
      setResult(calculateRation(product, input));
      setLastInput(input);
      setStarred(isFavorite(input));
      setPhase("result");
    } catch {
      // parametri incompatibili col prodotto: resta sul form precompilato
    }
  }, [initialProductId, reset]);

  // Ripristino dell'ultima ricerca dal Local Storage (solo senza preselezione SEO).
  useEffect(() => {
    if (initialBrandSlug) return;
    const last = loadLastSearch();
    if (!last) return;
    const product = dataProvider.getProductById(last.productId);
    if (!product) return;
    reset({
      brandSlug: product.brandSlug,
      productId: product.id,
      weightKg: last.weightKg,
      lifeStage: last.lifeStage,
      ageMonths: last.ageMonths,
      sex: last.sex,
      neutered: last.neutered,
      activity: last.activity,
    });
    toast("Ultima ricerca ripristinata", {
      description: `${product.name} · ${last.weightKg} kg`,
    });
  }, [initialBrandSlug, reset]);

  const onSubmit = (values: CalcFormValues) => {
    const product = dataProvider.getProductById(values.productId);
    if (!product) {
      toast.error("Prodotto non trovato nel database");
      return;
    }
    const input: CalcInput = {
      productId: values.productId,
      weightKg: values.weightKg,
      lifeStage: values.lifeStage,
      ageMonths: values.lifeStage === "puppy" ? values.ageMonths : undefined,
      sex: values.sex,
      neutered: values.neutered,
      activity: values.activity,
    };
    setPhase("loading");
    // Il calcolo è sincrono; il breve loading rende leggibile la transizione.
    window.setTimeout(() => {
      try {
        const res = calculateRation(product, input);
        saveLastSearch(input);
        const brand = dataProvider.getBrand(product.brandSlug);
        addToHistory({
          input,
          gramsPerDay: res.gramsPerDay,
          brandName: brand?.name ?? product.brandSlug,
          productName: product.name,
          timestamp: Date.now(),
        });
        setResult(res);
        setLastInput(input);
        setStarred(isFavorite(input));
        setPhase("result");
      } catch (err) {
        toast.error(err instanceof Error ? err.message : "Errore di calcolo");
        setPhase("form");
      }
    }, 450);
  };

  const onSelectHistory = (entry: HistoryEntry) => {
    const product = dataProvider.getProductById(entry.input.productId);
    if (!product) {
      toast.error("Questo prodotto non è più nel database");
      return;
    }
    reset({
      brandSlug: product.brandSlug,
      productId: product.id,
      weightKg: entry.input.weightKg,
      lifeStage: entry.input.lifeStage,
      ageMonths: entry.input.ageMonths,
      sex: entry.input.sex,
      neutered: entry.input.neutered,
      activity: entry.input.activity,
    });
  };

  const onToggleFavorite = () => {
    if (!lastInput || !result || !selectedProduct || !selectedBrand) return;
    const nowStarred = toggleFavorite({
      input: lastInput,
      gramsPerDay: result.gramsPerDay,
      brandName: selectedBrand.name,
      productName: selectedProduct.name,
      timestamp: Date.now(),
    });
    setStarred(nowStarred);
    toast(nowStarred ? "Salvato nei preferiti" : "Rimosso dai preferiti");
  };

  const selectedProduct = productId
    ? dataProvider.getProductById(productId)
    : undefined;
  const selectedBrand = brandSlug ? dataProvider.getBrand(brandSlug) : undefined;

  return (
    <div className="mx-auto w-full max-w-xl px-4">
      <AnimatePresence mode="wait">
        {phase === "hero" && (
          <motion.section key="hero" {...fade} className="py-24 text-center sm:py-32">
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ delay: 0.1, duration: 0.4 }}
              className="mx-auto mb-8 flex h-20 w-28 items-center justify-center rounded-3xl bg-primary/10 px-4"
            >
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img src="/dog.png" alt="" className="h-14 w-auto dark:invert" />
            </motion.div>
            <h1 className="text-balance text-4xl font-semibold tracking-tight sm:text-5xl">
              Calcola la dose perfetta di crocchette
            </h1>
            <p className="mx-auto mt-4 max-w-md text-balance text-lg text-muted-foreground">
              In meno di 30 secondi scoprirai la quantità ideale per il tuo cane.
            </p>
            <Button size="lg" className="mt-10" onClick={() => setPhase("form")}>
              Inizia
              <ArrowRight className="h-4 w-4" />
            </Button>
          </motion.section>
        )}

        {phase === "form" && (
          <motion.section key="form" {...fade} className="py-10 sm:py-16">
            {initialBrandSlug ? (
              // Sulle pagine prodotto "Indietro" torna alla pagina della
              // marca: la hero fuori contesto era un vicolo cieco.
              <a
                href={`/${initialBrandSlug}`}
                className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Tutte le linee della marca
              </a>
            ) : (
              <button
                type="button"
                onClick={() => setPhase("hero")}
                className="mb-6 inline-flex items-center gap-1.5 text-sm text-muted-foreground transition-colors hover:text-foreground"
              >
                <ArrowLeft className="h-4 w-4" /> Indietro
              </button>
            )}

            <HistoryStrip onSelect={onSelectHistory} />

            <Card className="p-6 sm:p-8">
              <form onSubmit={handleSubmit(onSubmit)} className="space-y-7">
                <Field label="Marca delle crocchette" error={errors.brandSlug?.message}>
                  <Controller
                    control={control}
                    name="brandSlug"
                    render={({ field }) => (
                      <Combobox
                        options={brands.map((b) => ({ value: b.slug, label: b.name }))}
                        value={field.value || null}
                        onChange={(v) => {
                          field.onChange(v);
                          setValue("productId", "", { shouldValidate: true });
                        }}
                        filter={searchBrands}
                        placeholder="Es. Royal Canin"
                      />
                    )}
                  />
                </Field>

                <Field label="Prodotto" error={errors.productId?.message}>
                  <Controller
                    control={control}
                    name="productId"
                    render={({ field }) => (
                      <Combobox
                        options={productOptions}
                        value={field.value || null}
                        onChange={field.onChange}
                        filter={searchProducts}
                        placeholder={
                          brandSlug ? "Cerca il prodotto" : "Prima scegli la marca"
                        }
                        disabled={!brandSlug}
                        emptyMessage={
                          <>
                            Nessun prodotto calcolabile per questa ricerca.{" "}
                            <a
                              href={brandSlug ? `/${brandSlug}` : "/catalogo"}
                              className="font-medium text-primary underline"
                            >
                              Vedi tutte le linee della marca
                            </a>
                            {" "}— quelle senza ✓ sono in lavorazione.
                          </>
                        }
                      />
                    )}
                  />
                </Field>

                <Field
                  label={
                    lifeStage === "puppy"
                      ? "Peso previsto da adulto (kg)"
                      : "Peso (kg)"
                  }
                  error={errors.weightKg?.message}
                >
                  <div className="flex items-center gap-4">
                    <Controller
                      control={control}
                      name="weightKg"
                      render={({ field }) => (
                        <>
                          <input
                            type="range"
                            min={1}
                            max={90}
                            step={0.5}
                            value={field.value ?? 15}
                            onChange={(e) => field.onChange(Number(e.target.value))}
                            aria-label="Peso in chilogrammi"
                          />
                          <input
                            type="number"
                            min={1}
                            max={90}
                            step={0.1}
                            value={field.value ?? ""}
                            onChange={(e) =>
                              field.onChange(
                                e.target.value === "" ? undefined : Number(e.target.value),
                              )
                            }
                            className="h-11 w-24 rounded-2xl border bg-card px-3 text-center text-sm font-medium shadow-soft outline-none focus:ring-2 focus:ring-primary"
                            aria-label="Peso in chilogrammi (numerico)"
                          />
                        </>
                      )}
                    />
                  </div>
                  {lifeStage === "puppy" && (
                    <p className="mt-2 text-xs text-muted-foreground">
                      Le tabelle puppy dei produttori usano il peso previsto da adulto,
                      non il peso attuale del cucciolo.
                    </p>
                  )}
                </Field>

                <Field label="Età" error={errors.lifeStage?.message}>
                  <Controller
                    control={control}
                    name="lifeStage"
                    render={({ field }) => (
                      <PillGroup
                        aria-label="Età"
                        options={[
                          { value: "puppy", label: "Cucciolo" },
                          { value: "adult", label: "Adulto" },
                          { value: "senior", label: "Senior" },
                        ]}
                        value={field.value ?? null}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field>

                <AnimatePresence>
                  {lifeStage === "puppy" && (
                    <motion.div
                      initial={{ opacity: 0, height: 0 }}
                      animate={{ opacity: 1, height: "auto" }}
                      exit={{ opacity: 0, height: 0 }}
                      transition={{ duration: 0.25 }}
                    >
                      <Field
                        label="Età del cucciolo (mesi)"
                        error={errors.ageMonths?.message}
                      >
                        <Controller
                          control={control}
                          name="ageMonths"
                          render={({ field }) => (
                            <input
                              type="number"
                              min={1}
                              max={24}
                              value={field.value ?? ""}
                              onChange={(e) =>
                                field.onChange(
                                  e.target.value === ""
                                    ? undefined
                                    : Number(e.target.value),
                                )
                              }
                              placeholder="Es. 6"
                              className="h-11 w-full rounded-2xl border bg-card px-4 text-sm shadow-soft outline-none focus:ring-2 focus:ring-primary"
                            />
                          )}
                        />
                      </Field>
                    </motion.div>
                  )}
                </AnimatePresence>

                <Field label="Sesso" error={errors.sex?.message}>
                  <Controller
                    control={control}
                    name="sex"
                    render={({ field }) => (
                      <PillGroup
                        aria-label="Sesso"
                        columns={2}
                        options={[
                          { value: "male", label: "Maschio" },
                          { value: "female", label: "Femmina" },
                        ]}
                        value={field.value ?? null}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field>

                <Field label="Sterilizzato?">
                  <Controller
                    control={control}
                    name="neutered"
                    render={({ field }) => (
                      <PillGroup
                        aria-label="Sterilizzato"
                        columns={2}
                        options={[
                          { value: "yes", label: "Sì" },
                          { value: "no", label: "No" },
                        ]}
                        value={field.value ? "yes" : "no"}
                        onChange={(v) => field.onChange(v === "yes")}
                      />
                    )}
                  />
                </Field>

                <Field label="Livello di attività" error={errors.activity?.message}>
                  <Controller
                    control={control}
                    name="activity"
                    render={({ field }) => (
                      <PillGroup
                        aria-label="Livello di attività"
                        options={[
                          { value: "low", label: "Bassa", hint: "< 1 h/giorno" },
                          { value: "medium", label: "Normale", hint: "1–2 h/giorno" },
                          { value: "high", label: "Alta", hint: "> 2 h/giorno" },
                        ]}
                        value={field.value ?? null}
                        onChange={field.onChange}
                      />
                    )}
                  />
                </Field>

                <Button type="submit" size="lg" className="w-full" disabled={!isValid}>
                  Calcola la dose
                </Button>
              </form>
            </Card>
          </motion.section>
        )}

        {phase === "loading" && (
          <motion.section key="loading" {...fade} className="space-y-4 py-16">
            <Skeleton className="h-44 w-full rounded-3xl" />
            <Skeleton className="h-20 w-full rounded-3xl" />
            <Skeleton className="h-28 w-full rounded-3xl" />
          </motion.section>
        )}

        {phase === "result" && result && selectedBrand && selectedProduct && (
          <motion.section key="result" {...fade} className="py-10 sm:py-16">
            <div id="print-area">
              <ResultCard
                result={result}
                brand={selectedBrand}
                product={selectedProduct}
                weightKg={weightKg}
              />
            </div>
            <div className="mt-6 flex flex-wrap justify-center gap-3">
              <Button variant="secondary" onClick={() => setPhase("form")}>
                <RotateCcw className="h-4 w-4" />
                Ricalcola
              </Button>
              <Button
                variant="secondary"
                onClick={onToggleFavorite}
                aria-pressed={starred}
              >
                <Star
                  className={
                    starred ? "h-4 w-4 fill-amber-400 text-amber-400" : "h-4 w-4"
                  }
                />
                {starred ? "Preferito" : "Salva"}
              </Button>
              <Button variant="secondary" onClick={() => window.print()}>
                <Printer className="h-4 w-4" />
                Stampa PDF
              </Button>
              <Button variant="secondary" onClick={() => setQrOpen(true)}>
                <QrCode className="h-4 w-4" />
                QR code
              </Button>
            </div>
            {lastInput && (
              <QrDialog
                open={qrOpen}
                onClose={() => setQrOpen(false)}
                path={buildSharePath(lastInput, selectedProduct)}
              />
            )}
          </motion.section>
        )}
      </AnimatePresence>
    </div>
  );
}

function Field({
  label,
  error,
  children,
}: {
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <div className="mb-2.5 flex items-baseline justify-between">
        <label className="text-sm font-medium">{label}</label>
        {error && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="text-xs text-red-500"
          >
            {error}
          </motion.span>
        )}
      </div>
      {children}
    </div>
  );
}
