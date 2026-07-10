/**
 * Test del motore di calcolo. Uso: npm run test:engine
 */
import { calculateRation } from "../src/lib/engine/calculator";
import { interpolate } from "../src/lib/engine/interpolate";
import { dataProvider } from "../src/lib/data/provider";
import type { CalcInput } from "../src/lib/types";

let failures = 0;
function expectEq(label: string, actual: number, expected: number, tol = 0.51) {
  const ok = Math.abs(actual - expected) <= tol;
  console.log(`${ok ? "PASS" : "FAIL"} ${label}: atteso ~${expected}, ottenuto ${actual}`);
  if (!ok) failures++;
}

// 1. Interpolazione pura: esempio del capitolato (20kg=270, 25kg=315 → 22kg≈288)
const r = interpolate([{ x: 20, y: 270 }, { x: 25, y: 315 }], 22);
expectEq("interpolazione 22 kg", r.value, 288);

// 2. Peso esatto in tabella: RC Medium Adult, 22 kg, attività media → 291 g
const rcMedium = dataProvider.getProductById("rc-medium-adult")!;
const base: CalcInput = {
  productId: "rc-medium-adult",
  weightKg: 22,
  lifeStage: "adult",
  sex: "male",
  neutered: false,
  activity: "medium",
};
expectEq("RC Medium 22kg medium", calculateRation(rcMedium, base).gramsPerDay, 291);

// 3. Colonna attività nativa: nessun modificatore attività aggiuntivo
const high = calculateRation(rcMedium, { ...base, activity: "high" });
expectEq("RC Medium 22kg high (colonna nativa)", high.gramsPerDay, 330);
if (high.modifiers.some((m) => m.label.includes("Attività"))) {
  console.log("FAIL modificatore attività applicato su tabella nativa");
  failures++;
}

// 4. Peso interpolato: RC Medium 21 kg medium → tra 271 e 291 ⇒ 281
expectEq(
  "RC Medium 21kg interpolato",
  calculateRation(rcMedium, { ...base, weightKg: 21 }).gramsPerDay,
  281,
);

// 5. Sterilizzato: -10% su 291 ⇒ 262
expectEq(
  "RC Medium 22kg sterilizzato",
  calculateRation(rcMedium, { ...base, neutered: true }).gramsPerDay,
  262,
);

// 6. Colonne ufficiali Monge (sottopeso→alta): 20 kg attività alta ⇒ 343
const monge = dataProvider.getProductById("monge-medium-adult-pollo")!;
const mongeHigh = calculateRation(monge, {
  ...base,
  productId: monge.id,
  weightKg: 20,
  activity: "high",
});
expectEq("Monge 20kg attività alta (colonna ufficiale)", mongeHigh.gramsPerDay, 343);
if (mongeHigh.modifiers.some((m) => m.label.includes("Attività"))) {
  console.log("FAIL modificatore attività applicato su colonne native Monge");
  failures++;
}

// 7. Puppy bilineare: RC Maxi Puppy, peso adulto 32 kg, 7 mesi.
//    32kg@6m: 449+(504-449)*2/5=471; 32kg@8m: 418+(470-418)*2/5=438.8; @7m ⇒ ~454.9
const puppy = dataProvider.getProductById("rc-maxi-puppy")!;
expectEq(
  "RC Maxi Puppy 32kg 7 mesi (bilineare)",
  calculateRation(puppy, {
    ...base,
    productId: puppy.id,
    weightKg: 32,
    lifeStage: "puppy",
    ageMonths: 7,
  }).gramsPerDay,
  455,
);

// 8. Range (Farmina): 22 kg ⇒ punto medio tra (170+315)/2=242.5 e (200+375)/2=287.5 ⇒ 260.5
const farmina = dataProvider.getProductById(
  "farmina-nd-ag-selection-adult-medium-maxi",
)!;
expectEq(
  "Farmina 22kg (punto medio range)",
  calculateRation(farmina, { ...base, productId: farmina.id }).gramsPerDay,
  261,
);

// 9. Clamp sopra il massimo: RC Medium 90 kg, attività media → valore a 25 kg (320) + nota
const clamped = calculateRation(rcMedium, { ...base, weightKg: 90 });
expectEq("RC Medium 90kg clampato", clamped.gramsPerDay, 320);
if (!clamped.notes.some((n) => n.includes("sopra il massimo"))) {
  console.log("FAIL nota di clamp mancante");
  failures++;
}

// 10. Senior su tabella già senior (RC Mini Adult 8+): niente -5% doppio
const mini = dataProvider.getProductById("rc-mini-adult-8plus")!;
const senior = calculateRation(mini, {
  ...base,
  productId: mini.id,
  weightKg: 8,
  lifeStage: "senior",
});
expectEq("RC Mini 8+ 8kg senior (tabella nativa)", senior.gramsPerDay, 132);

// 11. Pasti: 302 g/giorno ⇒ 151 × 2 e ~101 × 3
const meals = calculateRation(rcMedium, { ...base, weightKg: 22 });
expectEq("divisione 2 pasti", meals.gramsPerMealTwo, Math.round(meals.gramsPerDay / 2));
expectEq("divisione 3 pasti", meals.gramsPerMealThree, Math.round(meals.gramsPerDay / 3));

if (failures > 0) {
  console.error(`\n${failures} test falliti`);
  process.exit(1);
}
console.log("\nTutti i test del motore superati.");
