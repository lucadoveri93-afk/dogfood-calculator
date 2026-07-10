# Layer di acquisizione dati (design)

Il database (`src/data/foods.json`) è oggi statico e versionato nel repo.
L'aggiornamento automatico futuro è progettato come **layer separato e
sostituibile**, esterno all'app:

```
[siti/API produttori] → [pipeline di acquisizione] → foods.json validato → deploy
```

## Contratto

La pipeline, comunque implementata (scraper Playwright, parser PDF, API
ufficiali quando disponibili), deve produrre un `FoodDatabase` conforme a
`src/lib/types.ts` e superare `npm run validate:db`. L'app non sa e non deve
sapere come i dati sono stati ottenuti: consuma solo il JSON tramite
`DataProvider` (`src/lib/data/provider.ts`).

## Linee guida per gli adapter

- Un adapter per produttore (`royal-canin.ts`, `monge.ts`, ...), ciascuno
  esporta `fetchProducts(): Promise<Product[]>`.
- Ogni prodotto acquisito registra `sourceUrl` e `sourceDate`.
- I quattro formati di tabella già supportati (`single`, `activity`, `range`,
  `puppyByAge`) coprono i formati reali osservati su Royal Canin, Monge,
  Farmina, Trainer, Purina e Hill's.
- La pipeline gira fuori dall'app (cron/CI), mai a runtime: le dosi non
  devono cambiare sotto i piedi dell'utente senza una release del dato.

## Nota legale

Le tabelle di razionamento sono contenuti dei produttori. Prima di
automatizzare lo scraping su larga scala, verificare i termini d'uso dei
singoli siti.
