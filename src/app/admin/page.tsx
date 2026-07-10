import type { Metadata } from "next";
import { Database, Lock } from "lucide-react";
import { Card } from "@/components/ui/card";
import { dataProvider } from "@/lib/data/provider";

export const metadata: Metadata = {
  title: "Admin",
  robots: { index: false, follow: false },
};

/**
 * Area admin — v1 in sola lettura, per scelta.
 *
 * Un pannello di modifica protetto da sola password lato client su un sito
 * statico non sarebbe vera sicurezza, e le modifiche non potrebbero comunque
 * persistere sul JSON del progetto senza un backend. In v1 il database si
 * aggiorna modificando src/data/foods.json e validando con `npm run
 * validate:db`. Il pannello CRUD arriverà con un backend autenticato.
 */
export default function AdminPage() {
  const db = dataProvider.getDatabase();
  return (
    <div className="mx-auto max-w-xl px-4 py-16">
      <Card className="p-8">
        <div className="mb-6 flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-primary/10">
            <Lock className="h-5 w-5 text-primary" />
          </div>
          <div>
            <h1 className="text-lg font-semibold">Amministrazione</h1>
            <p className="text-sm text-muted-foreground">
              v1 — database in sola lettura
            </p>
          </div>
        </div>
        <div className="space-y-3 text-sm leading-relaxed text-muted-foreground">
          <p>
            Il database vive in <code className="rounded bg-muted px-1.5 py-0.5">src/data/foods.json</code>{" "}
            ed è la sola fonte di verità. Per aggiungere marche, prodotti o
            tabelle: modifica il JSON, esegui{" "}
            <code className="rounded bg-muted px-1.5 py-0.5">npm run validate:db</code>{" "}
            e fai il deploy.
          </p>
          <p>
            Un editor CRUD online richiede un backend con autenticazione vera;
            è previsto nella roadmap (vedi README).
          </p>
        </div>
        <div className="mt-6 flex items-center gap-2 rounded-2xl bg-muted px-4 py-3 text-sm">
          <Database className="h-4 w-4 text-muted-foreground" />
          <span>
            {db.brands.length} marche · {db.products.length} prodotti · v{db.version} ({db.updatedAt})
          </span>
        </div>
      </Card>
    </div>
  );
}
