# DogFood Calculator

Web app per calcolare la razione giornaliera di crocchette del cane a partire
dalle **tabelle di razionamento ufficiali dei produttori**, con interpolazione
lineare sui pesi intermedi e correzioni per sterilizzazione, attività ed età.

Stack: Next.js 14 (App Router) · TypeScript · Tailwind CSS · Framer Motion ·
React Hook Form · Zod · Fuse.js · next-themes · sonner · Lucide Icons.

## Avvio rapido

```bash
npm install
npm run dev        # http://localhost:3000
```

Altri comandi:

```bash
npm run build       # build di produzione (genera anche le pagine SEO statiche)
npm run start       # serve la build
npm run typecheck   # tsc --noEmit
npm run validate:db # valida src/data/foods.json con Zod
npm run test:engine # test del motore di calcolo (interpolazione, modificatori)
```

## Deploy

La v1 non ha backend: qualunque hosting Next.js va bene (Vercel, Netlify,
Node self-hosted). Su Vercel: `vercel deploy`, nessuna variabile d'ambiente
richiesta. Prima del deploy aggiorna il dominio in `src/app/sitemap.ts`,
`src/app/robots.ts` e `metadataBase` in `src/app/layout.tsx`.

## Struttura

```
src/
  app/                    # App Router: home, /[brand], /[brand]/[product], /admin
  components/
    calculator/           # wizard, schema Zod, card risultato
    ui/                   # componenti stile shadcn (button, card, combobox, …)
  lib/
    engine/               # interpolate.ts, calculator.ts (puro, testabile)
    data/                 # provider.ts (DataProvider), acquisition.md (design scraping)
    search.ts             # ricerca fuzzy (Fuse.js)
    storage.ts            # Local Storage ultima ricerca
    types.ts              # tipi di dominio
  data/foods.json         # DATABASE — unica fonte di verità
scripts/                  # validate-db.ts, test-engine.ts
```

## Il database (`src/data/foods.json`)

Nessun valore è cablato nel codice: tutto viene dal JSON. Ogni prodotto
dichiara una o più tabelle in uno di quattro formati, che coprono i formati
reali pubblicati dai produttori:

| kind         | Uso                                        | Esempio reale        |
| ------------ | ------------------------------------------ | -------------------- |
| `single`     | un valore per peso                         | Hill's, Monge        |
| `activity`   | colonne per attività bassa/media/alta      | Royal Canin, Trainer |
| `range`      | intervallo min–max per peso                | Farmina              |
| `puppyByAge` | matrice età (mesi) × peso adulto previsto  | Royal Canin Puppy    |

I 10 prodotti iniziali (Royal Canin, Monge, Farmina, Natural Trainer, Purina
Pro Plan, Hill's) usano **dati reali** acquisiti dai siti dei produttori il
2026-07-10; ogni record riporta `sourceUrl` e `sourceDate`. I dati vanno
riverificati periodicamente: i produttori aggiornano le formule.

### Aggiungere un prodotto

1. Aggiungi il record in `foods.json` (marca in `brands` se nuova).
2. `npm run validate:db` — schema Zod + coerenza referenziale.
3. `npm run test:engine` e build. Le pagine SEO del nuovo prodotto vengono
   generate automaticamente.

La struttura scala a migliaia di prodotti: la ricerca è fuzzy e indicizzata
(Fuse.js), le pagine sono statiche, il JSON può essere spezzato per marca
dietro lo stesso `DataProvider` quando crescerà.

## Motore di calcolo

- **Peso esatto in tabella** → valore del produttore, nessun arrotondamento
  grossolano (si arrotonda solo al grammo).
- **Peso intermedio** → interpolazione lineare tra i due punti adiacenti
  (es. 20 kg = 270 g, 25 kg = 315 g → 22 kg = 288 g).
- **Fuori range** → clamp all'estremo più vicino + nota esplicita (mai
  estrapolazione: nessuna fonte la supporterebbe).
- **Cuccioli** → tabella `puppyByAge` con interpolazione bilineare
  (età × peso adulto previsto). Serve l'età in mesi: il form la chiede solo
  quando selezioni "Cucciolo".

### Modificatori

| Condizione      | Correzione | Note                                                     |
| --------------- | ---------- | -------------------------------------------------------- |
| Sterilizzato    | −10%       | sempre                                                   |
| Attività alta   | +15%       | solo se la tabella non ha colonne attività native        |
| Attività bassa  | −10%       | idem                                                     |
| Senior          | −5%        | non applicato se la tabella è già calibrata senior       |
| Cucciolo        | —          | usa la tabella puppy; niente modificatori percentuali    |
| Sesso           | —          | registrato ma senza fattore: non esiste uno standard     |

Se il produttore pubblica colonne per attività (Royal Canin, Trainer, Pro
Plan), quelle vincono sempre sui modificatori generici.

## Pagine SEO

- `/{marca}` (es. `/royal-canin`) — elenco prodotti della marca
- `/{marca}/{prodotto}` (es. `/royal-canin/maxi-adult`) — calcolatore
  preimpostato sul prodotto

Tutte statiche (`generateStaticParams`), con metadata dinamici, sitemap
(`/sitemap.xml`) e robots generati dal database.

## /admin

In v1 è **in sola lettura** (mostra lo stato del database). Motivo: senza un
backend, una password lato client non è sicurezza reale e le modifiche non
possono persistere nel JSON del progetto. Il flusso di aggiornamento v1 è:
modifica `foods.json` → `npm run validate:db` → deploy. Il pannello CRUD con
autenticazione vera è in roadmap.

## Acquisizione automatica dei dati

Progettata come layer separato e sostituibile, documentata in
`src/lib/data/acquisition.md`: adapter per produttore → `FoodDatabase`
validato → deploy. L'app consuma i dati solo tramite l'interfaccia
`DataProvider` (`src/lib/data/provider.ts`), quindi la sorgente (JSON statico,
API, scraping, cloud) è intercambiabile senza toccare UI o motore.

## Roadmap / estensioni previste dall'architettura

- Extra UX: confronto tra due prodotti, cronologia, preferiti, stampa PDF,
  QR code (il motore è puro e riusabile; `CalcInput`/`CalcResult` sono già
  serializzabili per share/QR).
- Gatti, umido, snack, BARF: nuovo campo `species`/`foodType` su `Product`,
  stesse tabelle.
- Fabbisogno calorico: `kcalPerKg` è già nel modello; il calcolo kcal è
  un'estensione del motore.
- Backend: API + auth + profili multi-cane dietro un nuovo `DataProvider`.

## Avvertenza

Le dosi sono indicative, derivate dalle tabelle pubbliche dei produttori.
Non sostituiscono il parere del veterinario.
