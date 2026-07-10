import type { Metadata } from "next";
import { CompareTool } from "@/components/compare/compare-tool";

export const metadata: Metadata = {
  title: "Confronta due crocchette",
  description:
    "Confronta le dosi giornaliere di due prodotti diversi per lo stesso cane, a parità di peso, età e attività.",
  alternates: { canonical: "/confronto" },
};

export default function ComparePage() {
  return <CompareTool />;
}
