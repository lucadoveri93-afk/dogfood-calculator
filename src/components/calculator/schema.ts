import { z } from "zod";

/** Schema del form, validato in tempo reale da react-hook-form + zod. */
export const calcFormSchema = z
  .object({
    brandSlug: z.string().min(1, "Scegli una marca"),
    productId: z.string().min(1, "Scegli un prodotto"),
    weightKg: z
      .number({ invalid_type_error: "Inserisci il peso" })
      .min(1, "Minimo 1 kg")
      .max(90, "Massimo 90 kg"),
    lifeStage: z.enum(["puppy", "adult", "senior"], {
      required_error: "Indica l'età",
    }),
    ageMonths: z
      .number({ invalid_type_error: "Inserisci l'età in mesi" })
      .min(1, "Minimo 1 mese")
      .max(24, "Oltre i 24 mesi usa Adulto")
      .optional(),
    sex: z.enum(["male", "female"], { required_error: "Indica il sesso" }),
    neutered: z.boolean(),
    activity: z.enum(["low", "medium", "high"], {
      required_error: "Indica l'attività",
    }),
  })
  .superRefine((data, ctx) => {
    if (data.lifeStage === "puppy" && data.ageMonths === undefined) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["ageMonths"],
        message: "Per un cucciolo serve l'età in mesi",
      });
    }
  });

export type CalcFormValues = z.infer<typeof calcFormSchema>;
