# Piano di acquisizione tabelle — stato e metodo

Obiettivo: coprire tutte le linee a catalogo con tabelle ufficiali,
tranne quelle per cui il produttore non pubblica dati per peso (da marcare
`tableUnavailable: true` in catalog.json dopo verifica).

**Tracker**: `src/data/catalog.json` — linea senza `productIds` = da fare.
Stato al 2026-07-11 (sessione 3): 36/605 coperte (catalogo esteso con Kudo e Virtus).

## Regole (non negoziabili)

1. Solo valori pubblicati dal produttore; mai stime o percentuali inventate.
2. Ogni prodotto registra `sourceUrl` + `sourceDate`.
3. Tabelle con colonne condizione corporea (thin/normal/overweight):
   mappare su attività alta/normale/bassa, con nota che lo spiega.
4. Diete veterinarie: `vet: true` sul prodotto (l'avviso in scheda è automatico).
5. Dopo ogni lotto: `npm run validate:db`, `npm run test:engine`, build, push.
6. Refuso evidente nella fonte → omettere la cella con nota, mai propagare.

## Fonti collaudate per brand

| Brand | Fonte | Pattern | Note |
| --- | --- | --- | --- |
| Royal Canin retail | royalcanin.com/mt | `/mt/dogs/products/retail-products/<slug>-<codice>` | codici noti: 3000-3009 serie size, 3030 giant puppy |
| Royal Canin Veterinary | royalcanin.com/ie | `/ie/dogs/products/vet-products/<slug>-<codice>` | fatti: 3911, low-fat-3932, renal-3916, urinary-so-3913, hypoallergenic-3910 (NON 3592), anallergenic-4014, diabetic-4086, hepatic-3927, satiety-weight-management-3948, gastrointestinal-puppy-3957, urinary-so-small-dog-3801, cardiac-3930, skin-care-4013, mobility-support-1829, sensitivity-control-3922, renal-select-4162, renal-special-4161, urinary-so-moderate-calorie-3800, gastrointestinal-moderate-calorie-3958. TRUCCO: /vet-products/<slug>-dry reindirizza all'URL con codice. Restanti 8: fibre-response, obesity-management, dermacomfort, calm, recovery (probabile solo wet), dental, neutered-adult, neutered-junior. Attenzione: tabelle a 2 colonne Normal/Overweight -> kind single su Normal con nota; refusi (riga 10kg Mobility) -> omettere riga con nota. Restanti: cercare codice con WebSearch site:royalcanin.com/ie (indice prodotti JS-rendered, inutile) |
| Royal Canin Breed | royalcanin.com/mt | `/mt/dogs/products/retail-products/<razza>-adult-<cod>` | labrador ~3011? da scoprire |
| Monge / Gemon / Special Dog | monge.it | PDF: `/wp-content/uploads/<anno>/<mese>/monge_cane_secco_<linea>_ITA.pdf` | cercare con WebSearch `site:monge.it filetype:pdf <linea>` |
| Farmina N&D | farmina.com | PDF dosi: `/fotoprodotti/dosi/<id>_<slug>.pdf` | link "Visualizza tabella dosi" nella pagina prodotto |
| Natural Trainer | naturaltrainer.com | `/row/en/dog/<slug>-<id>.html` | tabella nella sezione "Feeding guidelines" |
| Purina Pro Plan | purina-proplan.it | WebSearch spesso restituisce la tabella nel riassunto | 2 colonne attività → medium = punto medio, con nota |
| Hill's | hillspet.ae / hillspet.co.uk | pagina prodotto, sezione feeding guide | verificare sempre sul sito, non solo dal riassunto di ricerca |
| Brit | brit-petfood.com | pagina prodotto SENZA tabella per peso | probabile `tableUnavailable`; ricontrollare i PDF di packaging dei retailer |
| Acana / Orijen | acana.com / orijen.ca | tabelle in cups sul packaging, sito ostico | bassa priorità; convertire cups→g solo se il produttore dichiara g/cup |
| Forza10 / Exclusion / Schesir / Almo / Oasy / Prolife | siti IT | da esplorare: probabile PDF o scheda prodotto | priorità alta (mercato IT) |

## Ordine dei lotti

1. RC Veterinary Diet restanti (26) — fonte /ie/ collaudata
2. RC SHN varianti età (5) + RC Breed (16)
3. Pro Plan (11 non-vet) e Hill's Science Plan (10)
4. Brand italiani: Forza10, Exclusion, Schesir, Almo Nature, Oasy, Prolife, Gemon, Special Dog
5. Trainer restanti, Monge BWild/Monoprotein, Farmina Pumpkin/Ocean/Quinoa
6. Esteri: Brit, Carnilove, Happy Dog, Josera, Belcando, Eukanuba, Advance, ...
7. Coda: Acana, Orijen, TOTW, Wolf of Wilderness (fonti difficili)

## Procedura per sessione (nuova chat)

1. Chiedere token GitHub fresco (Contents RW su dogfood-calculator, 1 day).
2. Leggere questo file + `catalog.json` per lo stato.
3. Lotto di 8-15 fetch → aggiungere prodotti a foods.json → collegare
   productIds in catalog.json → validare/testare/buildare → push.
4. Linee verificate senza dati pubblici: `tableUnavailable: true` + push.
